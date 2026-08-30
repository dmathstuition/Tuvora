import Link from 'next/link';
import { GraduationCap, Sparkles, ShieldCheck, Star } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';

const VALUE_PROPS = [
  { icon: GraduationCap, title: 'Everything in one place', body: 'Learners, live lessons, homework, progress and payments.' },
  { icon: Sparkles, title: 'Delightful for students', body: 'A playful learner app that keeps them coming back.' },
  { icon: ShieldCheck, title: 'Secure & private', body: 'Row-level security keeps every academy’s data its own.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-accent/20 px-6 py-8">
        <div className="blob left-[-6rem] top-[-4rem] h-72 w-72 bg-brand-300/40" />
        <div className="blob bottom-[-6rem] right-[-4rem] h-72 w-72 bg-fuchsia-300/30" />

        <div className="relative mb-auto">
          <Link href="/" aria-label="Tuvora home" className="inline-flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-brand-900">Tuvora</span>
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-sm py-10">
          <div className="glass-card rounded-3xl">{children}</div>
        </div>

        <p className="relative mx-auto w-full max-w-sm text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tuvora · Manage. Teach. Grow.
        </p>
      </div>

      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-12 text-white lg:flex">
        <div className="blob left-6 top-4 h-72 w-72 bg-fuchsia-400/30" />
        <div className="blob bottom-10 right-2 h-80 w-80 bg-sky-400/30" />

        <div className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <LogoMark className="h-6 w-6" />
          </span>
          <span className="text-sm font-bold uppercase tracking-widest text-white/80">Tuvora</span>
        </div>

        <div className="relative space-y-8">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            The operating system for tutoring businesses
          </h2>
          <ul className="space-y-4">
            {VALUE_PROPS.map((v) => (
              <li key={v.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <v.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{v.title}</p>
                  <p className="text-sm text-brand-100">{v.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="glass rounded-2xl border-white/20 bg-white/10 p-5">
            <div className="mb-2 flex gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-white/90">
              “Tuvora replaced three tools — my learners join live lessons in a tap and I finally get
              paid on time.”
            </p>
            <p className="mt-2 text-xs font-semibold text-brand-100">A growing online academy</p>
          </div>
        </div>

        <p className="relative text-sm font-medium uppercase tracking-widest text-brand-300">
          14-day free trial · No credit card
        </p>
      </div>
    </div>
  );
}
