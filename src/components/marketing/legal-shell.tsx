import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import { LEGAL_PAGES, legalConfig } from '@/config/legal';

/**
 * Shared chrome + typographic styling for the legal pages. Children are plain
 * semantic HTML (h2/h3/p/ul); the wrapper styles them so each page stays
 * content-only and readable.
 */
export function LegalShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="blob left-[-8rem] top-[-6rem] h-80 w-80 bg-brand-300/30" />

      <section className="container relative max-w-3xl py-14 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 dark:text-foreground">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">Last updated: {legalConfig.lastUpdated}</p>
          </div>
        </div>

        {intro && <p className="mt-6 text-base text-muted-foreground">{intro}</p>}

        <article
          className="mt-8 text-sm leading-relaxed text-foreground/90 [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-brand-900 dark:[&_h2]:text-foreground [&_h3]:mb-1.5 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        >
          {children}
        </article>

        {/* Cross-links to the other legal pages */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-muted/30 p-5">
          <p className="mb-2 text-sm font-semibold">More legal</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="text-muted-foreground hover:text-foreground">
                {p.title}
              </Link>
            ))}
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
