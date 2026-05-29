import Link from 'next/link';
import { BrandMark } from '@/components/site/brand-mark';

export function SiteFooter() {
  return (
    <footer className="border-t border-mist">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-7 py-7 text-xs text-stone sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span>© {new Date().getFullYear()} Revue. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap gap-[18px]">
          <a href="https://revuesuite.com" className="hover:text-ink">Product</a>
          <a href="https://revuesuite.com/join-beta.html" className="hover:text-ink">Pricing</a>
          <Link href="/rss.xml" className="hover:text-ink">RSS</Link>
          <a href="https://twitter.com/revuesuite" className="hover:text-ink">Twitter</a>
          <a href="https://linkedin.com/company/revuesuite" className="hover:text-ink">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
