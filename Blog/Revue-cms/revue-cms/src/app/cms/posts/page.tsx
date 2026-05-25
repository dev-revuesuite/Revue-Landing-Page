import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/cms/status-badge';
import { formatRelativeTime } from '@/lib/utils';
import { PostRowActions } from './row-actions';

export const dynamic = 'force-dynamic';

export default async function PostsList({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from('posts')
    .select('id,title,slug,status,published_at,updated_at,author_id,category_id')
    .order('updated_at', { ascending: false });

  if (sp.status) q = q.eq('status', sp.status);

  const { data: posts } = await q;

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id).filter(Boolean))] as string[];
  const categoryIds = [...new Set((posts ?? []).map((p) => p.category_id).filter(Boolean))] as string[];

  const [{ data: authors }, { data: categories }] = await Promise.all([
    authorIds.length
      ? supabase.from('authors').select('id,name').in('id', authorIds)
      : Promise.resolve({ data: [] }),
    categoryIds.length
      ? supabase.from('categories').select('id,name,slug').in('id', categoryIds)
      : Promise.resolve({ data: [] }),
  ]);

  const authorMap = new Map((authors ?? []).map((a: { id: string; name: string }) => [a.id, a.name]));
  const categoryMap = new Map((categories ?? []).map((c: { id: string; name: string; slug: string }) => [c.id, c]));

  const tabs = [
    { value: '', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
  ];

  return (
    <div className="px-8 py-6">
      <div className="mb-7">
        <p className="text-xs text-stone">Workspace · Posts</p>
        <h1 className="headline-serif mt-1 text-[28px]">Posts</h1>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-mist bg-paper">
        <div className="flex flex-col gap-3 border-b border-mist px-[18px] py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium">All posts</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {tabs.map((t) => (
                <Link
                  key={t.value}
                  href={t.value ? `/cms/posts?status=${t.value}` : '/cms/posts'}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    (sp.status || '') === t.value ? 'bg-ink text-white' : 'text-stone hover:bg-warm'
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <Link
              href="/cms/posts/new"
              className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New post
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_110px_130px_100px_24px] gap-4 border-b border-warm bg-journal px-[18px] py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#a8a8a0] max-md:hidden">
          <div>Title</div>
          <div>Status</div>
          <div>Author</div>
          <div>Updated</div>
          <div />
        </div>

        {(posts ?? []).length === 0 ? (
          <p className="px-[18px] py-12 text-center text-sm text-stone">No posts here yet.</p>
        ) : (
          (posts ?? []).map((p) => (
            <div
              key={p.id}
              className="grid gap-3 border-b border-warm px-[18px] py-3 last:border-0 max-md:grid-cols-1 md:grid-cols-[1fr_110px_130px_100px_24px] md:items-center md:gap-4"
            >
              <div>
                <Link href={`/cms/posts/${p.id}/edit`} className="text-[13px] font-medium text-ink hover:text-brand">
                  {p.title}
                </Link>
                <p className="mt-0.5 text-[11px] text-stone">
                  {categoryMap.get(p.category_id!)?.name ?? 'Uncategorized'} · /{p.slug}
                </p>
              </div>
              <div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-[13px] text-stone max-md:hidden">
                {authorMap.get(p.author_id!) ?? '—'}
              </div>
              <div className="text-[13px] text-stone">
                {formatRelativeTime(p.updated_at)}
              </div>
              <div className="max-md:hidden">
                <PostRowActions id={p.id} slug={p.slug} status={p.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
