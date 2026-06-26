// Shared types for the blog automation pipeline.

/** A row read from the Google Sheet that still needs processing. */
export interface SheetRow {
  /** Stable dedupe key: the sheet's `id` column if present, else `title:<slug>`. */
  sourceKey: string;
  /** 1-based row number in the sheet (for write-back). 0 if unknown. */
  sheetRow: number;
  title: string;
  keywords: string;
  category: string;
  tags: string;
  notes: string;
  /** Per-article instructions from the sheet — combined with the fixed system prompt. */
  prompt: string;
  /** Public HTTPS URL to the featured image (CEO fills this in the sheet). */
  imageUrl: string;
}

/** Status values the pipeline writes back to the sheet for human visibility. */
export type SheetWritebackStatus = 'processing' | 'published' | 'failed';

export interface StatusWriteback {
  sheetRow: number;
  status: SheetWritebackStatus;
  postUrl?: string;
  error?: string;
}

/** A single failure included in the alert email summary. */
export interface FailureAlert {
  title: string;
  error: string;
}

/** Featured image uploaded to Supabase Storage. */
export interface FeaturedImageResult {
  url: string;
  storagePath: string;
  altText: string;
}

/** Structured article produced by the Gemini text step. */
export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  /** Sanitized semantic HTML body (cleaned downstream before storage). */
  content_html: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  tags: string[];
  faqs: { question: string; answer: string }[];
}

/** Result of publishing a generated article to the live blog. */
export interface PublishedPostResult {
  postId: string;
  slug: string;
  url: string;
}

/** A row of the `content_jobs` ledger table (mirrors supabase/automation.sql). */
export interface ContentJobRow {
  id: string;
  source_key: string;
  sheet_row: number | null;
  title: string;
  keywords: string | null;
  category: string | null;
  tags: string | null;
  notes: string | null;
  prompt: string | null;
  image_url: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed';
  attempts: number;
  max_attempts: number;
  error: string | null;
  post_id: string | null;
  post_url: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
