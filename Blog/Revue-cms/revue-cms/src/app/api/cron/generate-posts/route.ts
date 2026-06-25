import { timingSafeEqual } from 'crypto';
import { runAutomationTick } from '@/lib/automation/worker';

export const runtime = 'nodejs';
export const maxDuration = 60;

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;

  const token = auth.slice('Bearer '.length).trim();
  if (token.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

async function handleTick(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAutomationTick();
    return Response.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[automation] tick failed:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

/** Secured cron endpoint — called by cron-job.org every few minutes. */
export async function POST(request: Request) {
  return handleTick(request);
}

/** Some schedulers only support GET; same auth + behavior as POST. */
export async function GET(request: Request) {
  return handleTick(request);
}
