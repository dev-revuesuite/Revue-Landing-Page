import 'server-only';
import sharp from 'sharp';
import { createServiceClient } from '@/lib/supabase/server';
import { featuredImageAlt } from '@/lib/utils';
import type { FeaturedImageResult } from './types';

/**
 * Featured image from the Google Sheet (CEO-supplied URL).
 * Downloads the image, resizes to 16:9 WebP, uploads to Supabase Storage.
 *
 * Image failure is non-fatal — returns null so the article can still publish.
 */

const FETCH_TIMEOUT_MS = 30_000;
const IN_CALL_RETRIES = 1;
const MAX_BYTES = 10 * 1024 * 1024;

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 675;

function safeStorageSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'post';
}

/** Turn common Google Drive share links into a direct download URL. */
export function normalizeImageUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // =IMAGE("https://...") pasted or returned from sheet formula parsing
  const imageFormula = trimmed.match(/^=IMAGE\s*\(\s*"([^"]+)"/i);
  if (imageFormula?.[1]) return imageFormula[1].trim();

  if (!/^https?:\/\//i.test(trimmed)) return null;

  const driveMatch = trimmed.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)|drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)|drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
  );
  const fileId = driveMatch?.[1] || driveMatch?.[2] || driveMatch?.[3];
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
}

async function fetchImageBytes(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'image/*,*/*;q=0.8' },
    });

    if (!res.ok) {
      throw new Error(`Image download failed (${res.status})`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      throw new Error('Image URL returned a web page, not an image — use a direct link or public Drive file');
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      throw new Error('Image file is too large (max 10 MB)');
    }
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Image download returned empty data');
    }

    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timer);
  }
}

async function processToWebp(raw: Buffer): Promise<Buffer> {
  return sharp(raw)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: 'cover', position: 'centre' })
    .webp({ quality: 85 })
    .toBuffer();
}

async function uploadToStorage(
  slug: string,
  webpBytes: Buffer,
  altText: string,
): Promise<FeaturedImageResult> {
  const supabase = createServiceClient();
  const safeSlug = safeStorageSlug(slug);
  const storagePath = `auto/${safeSlug}.webp`;
  const filename = `${safeSlug}.webp`;

  const { error: upErr } = await supabase.storage.from('media').upload(storagePath, webpBytes, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true,
  });
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(storagePath);

  const { error: dbErr } = await supabase.from('media').insert({
    url: publicUrl,
    storage_path: storagePath,
    filename,
    mime_type: 'image/webp',
    width: OUTPUT_WIDTH,
    height: OUTPUT_HEIGHT,
    size_bytes: webpBytes.length,
    alt_text: altText,
    folder: 'auto',
    uploaded_by: null,
  });
  if (dbErr) {
    await supabase.storage.from('media').remove([storagePath]);
    throw new Error(`Media row insert failed: ${dbErr.message}`);
  }

  return { url: publicUrl, storagePath, altText };
}

/**
 * Download the CEO's sheet image URL and upload it as the post featured image.
 * Returns null if no URL, or on failure (non-fatal).
 */
export async function importFeaturedImageFromSheet(params: {
  imageUrl: string | null | undefined;
  slug: string;
  title: string;
  excerpt?: string | null;
}): Promise<FeaturedImageResult | null> {
  const normalized = normalizeImageUrl(params.imageUrl ?? '');
  if (!normalized) return null;

  const altText = featuredImageAlt(params.title, params.excerpt);

  let lastError: unknown;
  for (let attempt = 0; attempt <= IN_CALL_RETRIES; attempt++) {
    try {
      const raw = await fetchImageBytes(normalized);
      const webpBytes = await processToWebp(raw);
      return await uploadToStorage(params.slug, webpBytes, altText);
    } catch (err) {
      lastError = err;
      if (attempt < IN_CALL_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  console.warn(
    '[automation] sheet featured image import failed:',
    lastError instanceof Error ? lastError.message : lastError,
  );
  return null;
}
