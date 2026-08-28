import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo showTagline />
          <p className="max-w-xs text-sm text-muted-foreground">
            The operating system for independent tutors and tutoring businesses.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <div className="container py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tuvora. Manage. Teach. Grow.
        </div>
      </div>
    </footer>
  );
}
