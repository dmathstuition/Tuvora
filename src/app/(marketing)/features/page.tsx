import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Video,
  ClipboardCheck,
  ClipboardList,
  CalendarCheck,
  LineChart,
  Wallet,
  Receipt,
  MessagesSquare,
  Trophy,
  Award,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything you need to run and grow your tutoring — in one platform.',
};

const groups = [
  {
    name: 'Teach',
    tint: 'from-indigo-500 to-violet-600',
    items: [
      { icon: Users, title: 'Learner management', body: 'Rich profiles with performance, attendance and progress.' },
      { icon: Video, title: 'Live online lessons', body: 'Create a class, drop in your link, learners join in a tap.' },
      { icon: ClipboardCheck, title: 'Assignments & homework', body: 'Set work; learners submit notebooks, photos or files.' },
      { icon: ClipboardList, title: 'Assessments & CBT', body: 'Timed quizzes and exams with auto-marking.' },
    ],
  },
  {
    name: 'Track',
    tint: 'from-emerald-500 to-teal-600',
    items: [
      { icon: CalendarCheck, title: 'Attendance', body: 'Take the register in seconds, right from the lesson.' },
      { icon: LineChart, title: 'Progress & reports', body: 'Trends over time and polished progress reports.' },
      { icon: Trophy, title: 'Gamification', body: 'Points, streaks, leagues and rewards keep learners hooked.' },
      { icon: Award, title: 'Certificates', body: 'Award and print beautiful certificates.' },
    ],
  },
  {
    name: 'Grow',
    tint: 'from-amber-500 to-orange-600',
    items: [
      { icon: Wallet, title: 'Payments', body: 'Collect fees from parents and learners in your currency.' },
      { icon: Receipt, title: 'Invoices', body: 'Send invoices and keep on top of balances.' },
      { icon: MessagesSquare, title: 'Messaging & parents', body: 'Keep parents in the loop with their own portal.' },
      { icon: ShieldCheck, title: 'Team & roles', body: 'Invite tutors and staff with the right permissions.' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="blob left-[-6rem] top-[-4rem] h-96 w-96 animate-blob bg-brand-400/40" />
      <div className="blob right-[-6rem] top-24 h-96 w-96 animate-blob bg-fuchsia-400/30 [animation-delay:-6s]" />

      <section className="container relative py-20 text-center md:py-28">
        <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-100">
          <Sparkles className="h-4 w-4 text-amber-500" /> Features
        </span>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-brand-100 dark:to-violet-300 md:text-6xl">
          Everything your tutoring runs on
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Not just an LMS — a complete platform to manage, teach and grow your tutoring, from your
          first learner to your hundredth.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="shadow-lg shadow-brand-500/25">
            <Link href="/signup">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {groups.map((g) => (
        <section key={g.name} className="container relative pb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{g.name}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {g.items.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-card rounded-3xl transition-transform duration-300 hover:-translate-y-1">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${g.tint} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="container relative py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-10 text-center text-white shadow-2xl md:p-16">
          <div className="blob left-10 top-0 h-64 w-64 bg-fuchsia-400/40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight">Ready to see it in action?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Start free with every feature unlocked for 14 days.
            </p>
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
