import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BrandMark } from '@/components/site/brand-mark';

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('name,slug')
    .order('name')
    .limit(4);

  return (
    <header className="border-b border-mist bg-paper">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-7 py-3.5">
        <div className="flex items-center gap-7">
          <Link href="https://revuesuite.com" className="flex items-center gap-2 text-ink no-underline">
            <BrandMark />
            <span className="text-[15px] font-medium">Revue</span>
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] text-slate md:flex">
            {(categories ?? []).map((c) => (
              <Link key={c.slug} href={`/blog?category=${c.slug}`} className="hover:text-ink">
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/blog" className="btn-mock-light hidden sm:inline-flex">
            <Search className="mr-1 h-3.5 w-3.5" aria-hidden />
            Search
          </Link>
          <Link href="/login" className="btn-mock-light">
            Sign in
          </Link>
          <a href="https://revuesuite.com/beta" className="btn-mock-dark">
            Join the beta
          </a>
        </div>
      </div>
    </header>
  );
}
