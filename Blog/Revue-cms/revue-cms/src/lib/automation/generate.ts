import 'server-only';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { slugify } from '@/lib/utils';
import type { SheetRow, GeneratedArticle } from './types';

/**
 * Gemini text generation: turns a SheetRow into a complete, structured article.
 * Uses structured JSON output (responseSchema) + Zod validation, with a couple
 * of in-call retries for transient/parse failures.
 */

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite';
const GENERATION_TIMEOUT_MS = 90_000;
const IN_CALL_RETRIES = 2;
const MAX_OUTPUT_TOKENS = 16384;

const META_TITLE_MAX = 70;
const META_DESC_MAX = 160;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
}

// ---- Gemini response schema (OpenAPI subset) ----
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    slug: { type: Type.STRING },
    excerpt: { type: Type.STRING },
    content_html: { type: Type.STRING },
    meta_title: { type: Type.STRING },
    meta_description: { type: Type.STRING },
    focus_keyword: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    faqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ['question', 'answer'],
        propertyOrdering: ['question', 'answer'],
      },
    },
  },
  required: [
    'title', 'slug', 'excerpt', 'content_html', 'meta_title',
    'meta_description', 'focus_keyword', 'tags', 'faqs',
  ],
  propertyOrdering: [
    'title', 'slug', 'excerpt', 'content_html', 'meta_title',
    'meta_description', 'focus_keyword', 'tags', 'faqs',
  ],
};

// ---- Zod validation (defensive — the model can still drift) ----
const ArticleSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().optional().default(''),
  excerpt: z.string().trim().min(1),
  content_html: z.string().trim().min(1),
  meta_title: z.string().trim().optional().default(''),
  meta_description: z.string().trim().optional().default(''),
  focus_keyword: z.string().trim().optional().default(''),
  tags: z.array(z.string().trim()).optional().default([]),
  faqs: z
    .array(z.object({ question: z.string().trim(), answer: z.string().trim() }))
    .optional()
    .default([]),
});

const SYSTEM_INSTRUCTION = [
  'You are the lead content writer for the Revue blog.',
  'Revue is a SaaS that helps creative agencies and in-house design teams centralize client feedback,',
  'manage revisions and approvals, and run quality checks on creative work.',
  'Your readers are agency owners, creative directors, and in-house creative-team leads.',
  'VOICE: direct, confident, and a little contrarian — you name a common assumption, then reveal the deeper operational truth behind it.',
  'Write in plain, punchy English. Use short paragraphs and frequent single-sentence paragraphs for rhythm and emphasis.',
  'Be specific and practical, grounded in real agency workflow experience.',
  'Never invent statistics, studies, or quotes. No fluff, no filler, no placeholder text.',
  'Always return valid JSON that matches the requested schema.',
].join(' ');

function buildPrompt(row: SheetRow): string {
  return [
    'Write a complete, original, long-form SEO blog article for the Revue blog,',
    'in the exact voice and shape of the existing Revue blog.',
    '',
    `TITLE / TOPIC: ${row.title}`,
    `TARGET KEYWORDS: ${row.keywords || '(none provided — infer sensible ones)'}`,
    `CATEGORY: ${row.category || '(choose a fitting one)'}`,
    `SUGGESTED TAGS: ${row.tags || '(infer 3–6 relevant tags)'}`,
    `EXTRA INSTRUCTIONS: ${row.notes || '(none)'}`,
    '',
    'VOICE & STYLE (match closely):',
    '- Direct, confident, lightly contrarian. Plain English, no corporate jargon, no fake statistics.',
    '- SHORT paragraphs. Use frequent single-sentence <p> lines for rhythm and emphasis.',
    '- Use <ul><li> for rapid-fire lists of symptoms, examples, or fixes.',
    '- Specific and practical, grounded in real creative-agency workflow reality.',
    '',
    'STRUCTURE (follow this shape):',
    '- Open with a hook that names a common assumption about the topic, then push back (e.g. "None of that is wrong. But it’s incomplete.").',
    '- State the deeper "hard truth".',
    '- Then several numbered deep-dive sections — each an <h2> like "1. ...", with <h3> sub-points where useful, short punchy <p> paragraphs, and <ul> lists.',
    '- Include a section <h2>Where Revue Fits In</h2> that connects the topic to Revue naturally (centralized feedback, revision/approval visibility, quality checks) — helpful, never salesy or over-promising.',
    '- End with a reflective <h2>Final Thought</h2> section that closes on a thought-provoking question or call to reflection.',
    '',
    'TECHNICAL REQUIREMENTS:',
    '- 1500–2500 words.',
    '- content_html: body as semantic HTML using ONLY these tags: <h2> <h3> <p> <ul> <ol> <li> <blockquote> <strong> <em> <a> <table> <thead> <tbody> <tr> <th> <td> <code> <pre>.',
    '- Do NOT include <h1>, <html>, <head>, <body>, <img>, <script>, <style>, or inline style attributes.',
    '- Start directly with a <p> introduction (no <h1>; the page renders the title separately).',
    '- Use the target keywords naturally; avoid keyword stuffing and repetition.',
    `- meta_title: <= ${META_TITLE_MAX} characters. meta_description: <= ${META_DESC_MAX} characters.`,
    '- focus_keyword: the single most important keyword.',
    '- tags: 3–6 short topical tags.',
    '- faqs: 3–5 genuinely useful Q&A pairs related to the topic.',
    '- slug: short, lowercase, hyphenated.',
    '',
    'Return strictly the JSON object matching the schema.',
  ].join('\n');
}

function clamp(value: string, max: number): string {
  const v = value.trim();
  return v.length > max ? v.slice(0, max).trimEnd() : v;
}

function normalize(row: SheetRow, parsed: z.infer<typeof ArticleSchema>): GeneratedArticle {
  const title = parsed.title || row.title;
  const slug = slugify(parsed.slug || title);
  const tags = Array.from(
    new Set(parsed.tags.map((t) => t.trim()).filter(Boolean)),
  ).slice(0, 8);

  return {
    title,
    slug,
    excerpt: parsed.excerpt,
    content_html: parsed.content_html,
    meta_title: clamp(parsed.meta_title || title, META_TITLE_MAX),
    meta_description: clamp(parsed.meta_description || parsed.excerpt, META_DESC_MAX),
    focus_keyword: parsed.focus_keyword || row.keywords.split(',')[0]?.trim() || '',
    tags,
    faqs: parsed.faqs.filter((f) => f.question && f.answer).slice(0, 6),
  };
}

async function callGemini(row: SheetRow): Promise<GeneratedArticle> {
  const ai = getClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: buildPrompt(row),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: controller.signal,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Gemini returned invalid JSON');
    }

    const parsed = ArticleSchema.parse(json);
    return normalize(row, parsed);
  } finally {
    clearTimeout(timer);
  }
}

/** Generate a structured article from a sheet row, with a few in-call retries. */
export async function generateArticle(row: SheetRow): Promise<GeneratedArticle> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= IN_CALL_RETRIES + 1; attempt++) {
    try {
      return await callGemini(row);
    } catch (err) {
      lastError = err;
      if (attempt <= IN_CALL_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw new Error(
    `Article generation failed after ${IN_CALL_RETRIES + 1} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
