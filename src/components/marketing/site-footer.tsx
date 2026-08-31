import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { LEGAL_PAGES } from '@/config/legal';

const columns = [
  {
    heading: 'Product',
    links: [
      { title: 'Features', href: '/features' },
      { title: 'Pricing', href: '/pricing' },
      { title: 'For Tutors', href: '/for-tutors' },
      { title: 'Demo', href: '/demo' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { title: 'About', href: '/about' },
      { title: 'Contact', href: '/contact' },
      { title: 'Log in', href: '/login' },
      { title: 'Start free trial', href: '/signup' },
    ],
  },
  {
    heading: 'Legal',
    links: LEGAL_PAGES.map((p) => ({ title: p.title, href: p.href })),
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-2">
          <Logo showTagline />
          <p className="max-w-xs text-sm text-muted-foreground">
            The operating system for independent tutors and tutoring businesses.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="mb-3 text-sm font-semibold">{col.heading}</p>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Tuvoria. All rights reserved.</span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-foreground">
                {p.title}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
