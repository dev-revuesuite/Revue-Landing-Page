import Link from 'next/link';
import { BrandMark } from '@/components/site/brand-mark';

export function SiteFooter() {
  return (
    <footer className="border-t border-mist">
      <div className="mx-auto max-w-[1200px] px-7 py-7">
        <div className="flex flex-col items-start justify-between gap-4 text-xs text-stone sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span>© {new Date().getFullYear()} Revuesuite Technologies Pvt Ltd. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap gap-[18px]">
            <a href="https://revuesuite.com" className="hover:text-ink">Product</a>
            <a href="https://revuesuite.com/join-beta.html" className="hover:text-ink">Pricing</a>
            <a
              href="https://revuesuite.com/assets/Revue%20Privacy%20Policy%20Draft.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              Privacy
            </a>
            <a
              href="https://revuesuite.com/assets/Revue%20Terms%20And%20Conditions%20Draft.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              Terms
            </a>
            <Link href="/rss.xml" className="hover:text-ink">RSS</Link>
            <a href="https://twitter.com/revuesuite" className="hover:text-ink">Twitter</a>
            <a href="https://linkedin.com/company/revuesuite" className="hover:text-ink">LinkedIn</a>
          </div>
        </div>
        <p className="mt-4 text-xs text-stone">
          Reach out to us -{' '}
          <a href="mailto:admin@revuesuite.com" className="hover:text-ink">
            admin@revuesuite.com
          </a>
        </p>
      </div>
    </footer>
  );
}
