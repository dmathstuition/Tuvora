import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Heart, Zap, ShieldCheck, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description: 'Tuvoria is on a mission to give every tutor the tools of a modern school.',
};

const values = [
  { icon: Heart, title: 'Learners first', body: 'Every decision starts with what helps students learn and stay motivated.' },
  { icon: Zap, title: 'Effortless', body: 'Powerful under the hood, simple on the surface — no training required.' },
  { icon: ShieldCheck, title: 'Trustworthy', body: 'Your data is yours. Strict per-academy isolation and security throughout.' },
  { icon: Globe, title: 'For everyone', body: 'Built for tutors everywhere — any subject, any currency, any device.' },
];

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="blob left-[-6rem] top-[-4rem] h-96 w-96 animate-blob bg-brand-400/40" />
      <div className="blob right-[-6rem] top-24 h-96 w-96 animate-blob bg-fuchsia-400/30 [animation-delay:-6s]" />

      <section className="container relative py-20 text-center md:py-28">
        <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-100">
          <Sparkles className="h-4 w-4 text-amber-500" /> Our mission
        </span>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-brand-100 dark:to-violet-300 md:text-6xl">
          The tools of a modern school, for every tutor
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Great tutors change lives — but they&apos;re often stuck juggling spreadsheets, chat apps
          and paper registers. Tuvoria brings everything a tutoring business needs into one calm,
          modern platform, so educators can spend their time teaching.
        </p>
      </section>

      <section className="container relative pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass-card rounded-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container relative pb-16">
        <div className="glass-card mx-auto grid max-w-3xl grid-cols-1 gap-6 rounded-3xl text-center sm:grid-cols-3">
          {[
            { value: 'All-in-one', label: 'Teach, track & get paid' },
            { value: '14 days', label: 'Free, full-access trial' },
            { value: 'Any device', label: 'Mobile-first everywhere' },
          ].map((s) => (
            <div key={s.label}>
              <p className="bg-gradient-to-br from-brand-700 to-violet-600 bg-clip-text text-2xl font-extrabold text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container relative py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-10 text-center text-white shadow-2xl md:p-16">
          <div className="blob left-10 top-0 h-64 w-64 bg-fuchsia-400/40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight">Join tutors growing with Tuvoria</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">Start free today — no credit card required.</p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary" className="shadow-lg">
                <Link href="/signup">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
