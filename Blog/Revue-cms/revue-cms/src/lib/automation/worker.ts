import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/utils';
import { generateArticle } from './generate';
import { importFeaturedImageFromSheet } from './images';
import { publishGeneratedPost } from './publish';
import { hasMeaningfulContent, sanitizeArticleHtml } from './sanitize';
import {
  fetchPendingRows,
  sendFailureAlert,
  writeBackStatus,
} from './sheets';
import type { ContentJobRow, FailureAlert, SheetRow } from './types';

/** Summary returned by each cron tick (for logs / debugging). */
export interface TickResult {
  synced: number;
  claimed: number;
  published: number;
  retried: number;
  failed: number;
  skippedReason?: string;
}

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function startOfTodayUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function allowedPublishCountByNow(dailyTarget: number): number {
  const now = new Date();
  const secondsSinceMidnight =
    now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  return Math.min(
    dailyTarget,
    Math.ceil((secondsSinceMidnight / 86400) * dailyTarget),
  );
}

function jobToSheetRow(job: ContentJobRow): SheetRow {
  return {
    sourceKey: job.source_key,
    sheetRow: job.sheet_row ?? 0,
    title: job.title,
    keywords: job.keywords ?? '',
    category: job.category ?? '',
    tags: job.tags ?? '',
    notes: job.notes ?? '',
    prompt: job.prompt ?? '',
    imageUrl: job.image_url ?? '',
  };
}

/** Reset jobs stuck in `processing` (e.g. after a crashed serverless invocation). */
async function reclaimStaleProcessingJobs(): Promise<void> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await supabase
    .from('content_jobs')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .lt('claimed_at', cutoff);
}

async function syncSheetToLedger(): Promise<number> {
  let rows;
  try {
    rows = await fetchPendingRows(100);
  } catch (err) {
    console.warn('[automation] sheet sync skipped:', err);
    return 0;
  }

  if (!rows.length) return 0;

  const supabase = createServiceClient();
  let synced = 0;

  for (const row of rows) {
    if (!row.imageUrl.trim()) continue;

    const { data: existing } = await supabase
      .from('content_jobs')
      .select('id, status')
      .eq('source_key', row.sourceKey)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('content_jobs').insert({
        source_key: row.sourceKey,
        sheet_row: row.sheetRow || null,
        title: row.title,
        keywords: row.keywords || null,
        category: row.category || null,
        tags: row.tags || null,
        notes: row.notes || null,
        prompt: row.prompt || null,
        image_url: row.imageUrl || null,
        status: 'pending',
      });
      if (!error) synced++;
      continue;
    }

    if (existing.status === 'pending') {
      const { error } = await supabase
        .from('content_jobs')
        .update({
          sheet_row: row.sheetRow || null,
          title: row.title,
          keywords: row.keywords || null,
          category: row.category || null,
          tags: row.tags || null,
          notes: row.notes || null,
          prompt: row.prompt || null,
          image_url: row.imageUrl || null,
        })
        .eq('id', existing.id);
      if (!error) synced++;
    }
  }

  return synced;
}

async function countPublishedToday(): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('content_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'done')
    .gte('completed_at', startOfTodayUtc());
  return count ?? 0;
}

async function finalizePublishedJob(
  job: ContentJobRow,
  published: { postId: string; url: string },
): Promise<void> {
  const supabase = createServiceClient();

  const { error: updateErr } = await supabase
    .from('content_jobs')
    .update({
      status: 'done',
      post_id: published.postId,
      post_url: published.url,
      completed_at: new Date().toISOString(),
      error: null,
    })
    .eq('id', job.id);

  if (updateErr) throw new Error(`Ledger update failed: ${updateErr.message}`);

  if (job.sheet_row) {
    await writeBackStatus({
      sheetRow: job.sheet_row,
      status: 'published',
      postUrl: published.url,
    });
  }
}

async function processJob(
  job: ContentJobRow,
): Promise<{ outcome: 'published' | 'retry' | 'failed'; error?: string }> {
  const supabase = createServiceClient();

  // Resume after a prior publish succeeded but finalization did not finish.
  if (job.post_id) {
    try {
      let url = job.post_url?.trim() ?? '';
      if (!url) {
        const { data: post } = await supabase
          .from('posts')
          .select('slug')
          .eq('id', job.post_id)
          .maybeSingle();
        if (!post) throw new Error('Linked post no longer exists');
        url = absoluteUrl(`/blog/${post.slug}`);
      }
      await finalizePublishedJob(job, { postId: job.post_id, url });
      return { outcome: 'published' };
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
      return { outcome: 'retry', error: message };
    }
  }

  if (job.sheet_row) {
    await writeBackStatus({ sheetRow: job.sheet_row, status: 'processing' });
  }

  try {
    const sheetRow = jobToSheetRow(job);
    const article = await generateArticle(sheetRow);
    const contentHtml = sanitizeArticleHtml(article.content_html);

    if (!hasMeaningfulContent(contentHtml)) {
      throw new Error('Generated article body is too short or empty after sanitization');
    }

    const image = await importFeaturedImageFromSheet({
      imageUrl: job.image_url,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      storageKey: job.id,
    });

    const published = await publishGeneratedPost({
      article,
      contentHtml,
      categoryName: job.category,
      sheetTags: job.tags,
      featuredImageUrl: image?.url ?? null,
    });

    // Persist post link before marking done so retries cannot create duplicates.
    const { error: linkErr } = await supabase
      .from('content_jobs')
      .update({
        post_id: published.postId,
        post_url: published.url,
      })
      .eq('id', job.id);

    if (linkErr) throw new Error(`Ledger link failed: ${linkErr.message}`);

    await finalizePublishedJob(job, published);

    return { outcome: 'published' };
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    const exhausted = job.attempts >= job.max_attempts;

    await supabase
      .from('content_jobs')
      .update({
        status: exhausted ? 'failed' : 'pending',
        error: message,
      })
      .eq('id', job.id);

    if (exhausted && job.sheet_row) {
      await writeBackStatus({
        sheetRow: job.sheet_row,
        status: 'failed',
        error: message.slice(0, 200),
      });
    }

    return { outcome: exhausted ? 'failed' : 'retry', error: message };
  }
}

/** One automation tick: sync → drip check → claim → generate → publish → record. */
export async function runAutomationTick(): Promise<TickResult> {
  const dailyTarget = envInt('DAILY_TARGET', 10);
  const dailyCap = envInt('DAILY_CAP', 12);
  const batchSize = envInt('BATCH_SIZE', 2);

  await reclaimStaleProcessingJobs();
  const synced = await syncSheetToLedger();

  const publishedToday = await countPublishedToday();

  if (publishedToday >= dailyCap) {
    return {
      synced,
      claimed: 0,
      published: 0,
      retried: 0,
      failed: 0,
      skippedReason: `Daily cap reached (${dailyCap})`,
    };
  }

  const allowedNow = allowedPublishCountByNow(dailyTarget);
  const dripRemaining = Math.max(0, allowedNow - publishedToday);
  const capRemaining = Math.max(0, dailyCap - publishedToday);
  const claimCount = Math.min(batchSize, dripRemaining, capRemaining);

  if (claimCount <= 0) {
    return {
      synced,
      claimed: 0,
      published: 0,
      retried: 0,
      failed: 0,
      skippedReason: 'Drip pacing — not yet time for the next publish slot',
    };
  }

  const supabase = createServiceClient();
  const { data: jobs, error: claimErr } = await supabase.rpc('claim_content_jobs', {
    batch: claimCount,
  });

  if (claimErr) {
    throw new Error(`Claim jobs failed: ${claimErr.message}`);
  }

  const claimed = (jobs ?? []) as ContentJobRow[];
  if (!claimed.length) {
    return {
      synced,
      claimed: 0,
      published: 0,
      retried: 0,
      failed: 0,
      skippedReason: 'No pending jobs in ledger',
    };
  }

  let published = 0;
  let retried = 0;
  let failed = 0;
  const alertFailures: FailureAlert[] = [];

  for (const job of claimed) {
    const { outcome, error } = await processJob(job);
    if (outcome === 'published') published++;
    else if (outcome === 'retry') retried++;
    else {
      failed++;
      alertFailures.push({ title: job.title, error: error ?? 'Unknown error' });
    }
  }

  if (alertFailures.length) {
    await sendFailureAlert(alertFailures);
  }

  return {
    synced,
    claimed: claimed.length,
    published,
    retried,
    failed,
  };
}
