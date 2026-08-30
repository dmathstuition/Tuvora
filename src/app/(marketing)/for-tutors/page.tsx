import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, User, Building2, Video, NotebookPen, Wallet, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'For Tutors',
  description: 'Whether you teach solo or run an academy, Tuvora scales with you.',
};

const audiences = [
  {
    icon: User,
    title: 'Solo tutors',
    tint: 'from-sky-500 to-blue-600',
    points: ['Look professional from day one', 'Schedule live lessons in seconds', 'Get paid on time, in your currency'],
  },
  {
    icon: Building2,
    title: 'Tutoring businesses',
    tint: 'from-indigo-500 to-violet-600',
    points: ['Invite tutors, admins & staff with roles', 'Oversee every class and learner', 'Track revenue, attendance & progress'],
  },
];

const steps = [
  { icon: Building2, title: 'Set up your academy', body: 'A guided wizard configures everything in minutes.' },
  { icon: Video, title: 'Teach live', body: 'Create a class, add your meeting link, learners join in a tap.' },
  { icon: NotebookPen, title: 'Set & grade work', body: 'Assign homework and CBT tests; grade in one place.' },
  { icon: Wallet, title: 'Get paid & grow', body: 'Collect fees and watch your academy grow.' },
];

export default function ForTutorsPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="blob left-[-6rem] top-[-4rem] h-96 w-96 animate-blob bg-brand-400/40" />
      <div className="blob right-[-6rem] top-24 h-96 w-96 animate-blob bg-sky-400/30 [animation-delay:-8s]" />

      <section className="container relative py-20 text-center md:py-28">
        <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-100">
          <Sparkles className="h-4 w-4 text-amber-500" /> Built for educators
        </span>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-brand-100 dark:to-violet-300 md:text-6xl">
          Made for tutors, at every stage
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Whether you teach one learner from your kitchen table or run an academy with a team of
          tutors, Tuvora scales with you.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="shadow-lg shadow-brand-500/25">
            <Link href="/signup">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="container relative pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {audiences.map(({ icon: Icon, title, tint, points }) => (
            <div key={title} className="glass-card rounded-3xl">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-md`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container relative pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="glass-card rounded-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-extrabold text-white dark:bg-white dark:text-brand-900">
                {i + 1}
              </span>
              <s.icon className="mt-4 h-5 w-5 text-brand-600" />
              <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container relative py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-10 text-center text-white shadow-2xl md:p-16">
          <div className="blob right-10 bottom-0 h-64 w-64 bg-sky-400/40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight">Your academy, running itself</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">Start free — every feature unlocked for 14 days.</p>
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
