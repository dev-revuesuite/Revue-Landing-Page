import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { buildMetadata, articleJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { absoluteUrl, formatDate } from '@/lib/utils';
import { ReadingProgress } from '@/components/site/reading-progress';
import { ShareButtons } from '@/components/site/share-buttons';
import { TableOfContents } from '@/components/site/toc';
import { InlineCTA, NewsletterCTA } from '@/components/site/cta';

export const revalidate = 60;

// ---------- Static params (ISR) ----------
export async function generateStaticParams() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString());
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

// ---------- Metadata ----------
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts').select('*').eq('slug', slug).eq('status', 'published').single();
  if (!post) return {};

  return buildMetadata({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    image: post.og_image || post.featured_image,
    type: 'article',
    publishedTime: post.published_at,
    canonical: post.canonical_url,
    robots: post.robots,
    keywords: post.focus_keyword,
  });
}

// ---------- Page ----------
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts').select('*').eq('slug', slug).eq('status', 'published').single();
  if (!post) notFound();

  const [{ data: author }, { data: category }, { data: tags }] = await Promise.all([
    post.author_id ? supabase.from('authors').select('*').eq('id', post.author_id).single() : Promise.resolve({ data: null }),
    post.category_id ? supabase.from('categories').select('*').eq('id', post.category_id).single() : Promise.resolve({ data: null }),
    supabase
      .from('post_tags')
      .select('tags(name,slug)')
      .eq('post_id', post.id),
  ]);

  // Related: same category, exclude current
  const { data: related } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,featured_image,published_at,reading_time')
    .eq('status', 'published')
    .eq('category_id', post.category_id)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);

  const url = absoluteUrl(`/blog/${post.slug}`);
  const faqs = Array.isArray(post.faqs) ? post.faqs : [];

  return (
    <>
      <ReadingProgress />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post, author, category)) }}
      />
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: absoluteUrl('/') },
              { name: 'Blog', url: absoluteUrl('/blog') },
              ...(category ? [{ name: category.name, url: absoluteUrl(`/blog?category=${category.slug}`) }] : []),
              { name: post.title, url },
            ])
          ),
        }}
      />

      {/* Article header */}
      <article>
        <header className="container max-w-3xl pt-16 md:pt-24">
          <div className="text-sm">
            <Link href="/blog" className="text-muted-foreground hover:text-ink">← The Journal</Link>
            {category && (
              <>
                <span className="mx-2 text-muted-foreground">/</span>
                <Link
                  href={`/blog?category=${category.slug}`}
                  className="font-mono text-xs uppercase tracking-[0.18em] text-brand hover:underline"
                >
                  {category.name}
                </Link>
              </>
            )}
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-6 font-serif text-xl leading-relaxed text-muted-foreground md:text-2xl">
              {post.excerpt}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4 border-y border-border py-4">
            {author && (
              <Link href={`/blog/author/${author.slug}`} className="flex items-center gap-3">
                {author.avatar_url && (
                  <Image
                    src={author.avatar_url}
                    alt={author.name}
                    width={36}
                    height={36}
                    className="rounded-full bg-mist"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-ink">{author.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.published_at && formatDate(post.published_at)} · {post.reading_time} min read
                  </p>
                </div>
              </Link>
            )}
            <div className="ml-auto">
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>
        </header>

        {/* Featured image */}
        {post.featured_image && (
          <div className="container my-12 max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-mist">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Body with TOC sidebar */}
        <div className="container max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_220px]">
            <div id="article-content" className="prose-article max-w-2xl mx-auto lg:mx-0">
              <div dangerouslySetInnerHTML={{ __html: post.content_html || '' }} />

              {/* Inline CTA halfway through is nice, but at the end works too */}
              <InlineCTA />

              {/* FAQs */}
              {faqs.length > 0 && (
                <section className="mt-16">
                  <h2>Frequently asked questions</h2>
                  <div className="not-prose space-y-4">
                    {faqs.map((f: any, i: number) => (
                      <details key={i} className="rounded-lg border border-border p-4 open:bg-mist/30">
                        <summary className="cursor-pointer font-semibold text-ink">{f.question}</summary>
                        <p className="mt-3 text-muted-foreground">{f.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="hidden lg:block">
              <TableOfContents />
            </aside>
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="container max-w-3xl mt-16">
            <div className="flex flex-wrap gap-2">
              {tags.map((t: any) => (
                <Link
                  key={t.tags.slug}
                  href={`/blog/tag/${t.tags.slug}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-mist"
                >
                  #{t.tags.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author bio */}
        {author && (
          <section className="container max-w-3xl mt-16 rounded-2xl border border-border bg-mist/30 p-8">
            <div className="flex items-start gap-4">
              {author.avatar_url && (
                <Image
                  src={author.avatar_url}
                  alt={author.name}
                  width={64}
                  height={64}
                  className="rounded-full bg-paper"
                />
              )}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Written by</p>
                <h3 className="mt-1 font-display text-xl font-bold">{author.name}</h3>
                {author.bio && <p className="mt-2 text-sm text-muted-foreground">{author.bio}</p>}
              </div>
            </div>
          </section>
        )}
      </article>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="container mt-32 border-t border-border pt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">Continue reading</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="group">
                {r.featured_image && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-mist">
                    <Image
                      src={r.featured_image}
                      alt={r.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <h3 className="mt-4 font-display text-lg font-bold leading-snug group-hover:underline underline-offset-4">
                  {r.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <NewsletterCTA />
    </>
  );
}
