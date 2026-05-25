import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  const [{ data: posts }, { data: categories }, { data: tags }, { data: authors }] = await Promise.all([
    supabase.from('posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString()),
    supabase.from('categories').select('slug'),
    supabase.from('tags').select('slug'),
    supabase.from('authors').select('slug'),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/blog'), changeFrequency: 'daily', priority: 0.9 },
  ];

  const postEntries: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: absoluteUrl(`/blog?category=${c.slug}`),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const tagEntries: MetadataRoute.Sitemap = (tags ?? []).map((t) => ({
    url: absoluteUrl(`/blog/tag/${t.slug}`),
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const authorEntries: MetadataRoute.Sitemap = (authors ?? []).map((a) => ({
    url: absoluteUrl(`/blog/author/${a.slug}`),
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  return [...staticEntries, ...postEntries, ...categoryEntries, ...tagEntries, ...authorEntries];
}
