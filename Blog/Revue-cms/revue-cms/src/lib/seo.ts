import type { Metadata } from 'next';
import { absoluteUrl } from './utils';
import type { Post, Author, Category } from './supabase/database.types';

const SITE_NAME = 'Revue';
const TWITTER = '@revuesuite';

export interface SeoInput {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  author?: string | null;
  canonical?: string | null;
  robots?: string | null;
  keywords?: string | null;
}

export function buildMetadata(s: SeoInput): Metadata {
  const url = s.canonical || absoluteUrl(s.path);
  const image = s.image || absoluteUrl('/og-default.png');
  const description = s.description || 'Insights and product updates from Revue, the platform for modern creative agencies.';

  return {
    title: s.title,
    description,
    keywords: s.keywords ?? undefined,
    alternates: { canonical: url },
    robots: s.robots ?? 'index,follow',
    openGraph: {
      type: s.type ?? 'website',
      url,
      title: s.title,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: s.title }],
      publishedTime: s.publishedTime ?? undefined,
      authors: s.author ? [s.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER,
      creator: TWITTER,
      title: s.title,
      description,
      images: [image],
    },
  };
}

/* ---------- JSON-LD generators ---------- */

export function articleJsonLd(post: Post, author?: Author | null, category?: Category | null) {
  return {
    '@context': 'https://schema.org',
    '@type': post.schema_type || 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image || post.featured_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: author
      ? { '@type': 'Person', name: author.name, url: absoluteUrl(`/blog/author/${author.slug}`) }
      : { '@type': 'Organization', name: 'Revue' },
    publisher: {
      '@type': 'Organization',
      name: 'Revue',
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.webp') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/blog/${post.slug}`) },
    articleSection: category?.name,
    keywords: post.focus_keyword,
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Revue',
    url: absoluteUrl('/'),
    logo: absoluteUrl('/logo.webp'),
    sameAs: ['https://twitter.com/revuesuite', 'https://linkedin.com/company/revuesuite'],
  };
}
