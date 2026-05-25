import { createServiceClient } from '@/lib/supabase/server';
import { absoluteUrl, escapeXml, stripHtml } from '@/lib/utils';

export const revalidate = 600; // 10 min

export async function GET() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('title, slug, excerpt, content_html, published_at, updated_at, author_id')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50);

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id).filter(Boolean))] as string[];
  const { data: authors } = authorIds.length
    ? await supabase.from('authors').select('id,name').in('id', authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a.name]));

  const items = (posts ?? []).map((p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${absoluteUrl(`/blog/${p.slug}`)}</link>
      <guid isPermaLink="true">${absoluteUrl(`/blog/${p.slug}`)}</guid>
      <pubDate>${p.published_at ? new Date(p.published_at).toUTCString() : ''}</pubDate>
      <dc:creator>${escapeXml(authorMap.get(p.author_id!) || 'Revue')}</dc:creator>
      <description>${escapeXml(p.excerpt || stripHtml(p.content_html || ''))}</description>
      <content:encoded><![CDATA[${p.content_html || ''}]]></content:encoded>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Revue Journal</title>
    <link>${absoluteUrl('/blog')}</link>
    <atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml" />
    <description>Field notes for modern creative agencies.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
