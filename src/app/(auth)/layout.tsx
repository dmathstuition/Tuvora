import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8">
        <Link href="/" aria-label="Tuvora home" className="mb-auto">
          <Logo />
        </Link>
        <div className="mx-auto w-full max-w-sm py-12">{children}</div>
        <p className="mx-auto w-full max-w-sm text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tuvora
        </p>
      </div>
      {/* Brand side */}
      <div className="hidden flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <div />
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            The operating system for tutoring businesses
          </h2>
          <p className="max-w-md text-brand-100">
            Manage learners, run classes, track progress, communicate with parents and collect
            payments — all from Tuvora.
          </p>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-300">
            Manage. Teach. Grow.
          </p>
        </div>
        <div />
      </div>
    </div>
  );
}
