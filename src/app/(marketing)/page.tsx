import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Video,
  ClipboardCheck,
  LineChart,
  Wallet,
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  Star,
  CalendarDays,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const modules = [
  {
    icon: Users,
    title: 'Learner management',
    body: 'Rich learner profiles with performance, attendance and progress in one place.',
    tint: 'from-sky-500 to-blue-600',
  },
  {
    icon: Video,
    title: 'Live online lessons',
    body: 'Create a class, drop in your meeting link, and learners join their live lessons in a tap.',
    tint: 'from-indigo-500 to-violet-600',
  },
  {
    icon: ClipboardCheck,
    title: 'Assignments & assessments',
    body: 'Set work, run quizzes and exams, and grade with auto-marking where possible.',
    tint: 'from-emerald-500 to-teal-600',
  },
  {
    icon: LineChart,
    title: 'Progress & reports',
    body: 'Track performance over time and generate professional progress reports.',
    tint: 'from-amber-500 to-orange-600',
  },
  {
    icon: Wallet,
    title: 'Payments & invoices',
    body: 'Collect payments from parents and learners, and keep on top of balances.',
    tint: 'from-rose-500 to-pink-600',
  },
  {
    icon: MessagesSquare,
    title: 'Parent engagement',
    body: 'Give parents a portal into their children’s attendance, grades and progress.',
    tint: 'from-fuchsia-500 to-purple-600',
  },
];

const steps = [
  { title: 'Create a class', body: 'Group or one-to-one — add your online meeting link.' },
  { title: 'Add learners', body: 'Invite learners and parents; everyone gets their own portal.' },
  { title: 'Schedule lessons', body: 'Assign live lessons to a class or a single learner.' },
  { title: 'Teach & track', body: 'Learners join in a tap; you track progress and get paid.' },
];

const stats = [
  { value: '14 days', label: 'Free, full-access trial' },
  { value: 'One tap', label: 'For learners to join live' },
  { value: 'All-in-one', label: 'Teach, track & get paid' },
];

export default function HomePage() {
  return (
    <>
      {/* Aurora background wrapper */}
      <div className="relative overflow-hidden">
        {/* Blobs */}
        <div className="blob left-[-8rem] top-[-6rem] h-96 w-96 animate-blob bg-brand-400/50" />
        <div className="blob right-[-6rem] top-24 h-96 w-96 animate-blob bg-fuchsia-400/40 [animation-delay:-6s]" />
        <div className="blob bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] animate-blob bg-sky-400/40 [animation-delay:-12s]" />

        {/* Hero */}
        <section className="container relative flex flex-col items-center py-20 text-center md:py-28">
          <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-100">
            <Sparkles className="h-4 w-4 text-amber-500" /> Manage. Teach. Grow.
          </span>
          <h1 className="max-w-4xl bg-gradient-to-br from-brand-900 via-brand-700 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-brand-100 dark:to-violet-300 md:text-6xl">
            The operating system for tutors and tutoring businesses
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Tuvoria brings learners, live online lessons, assessments, progress, communication and
            payments together — so you can run your entire tutoring operation from one beautiful
            place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-lg shadow-brand-500/25">
              <Link href="/signup">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass border-white/50">
              <Link href="/demo">See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14-day free trial · All features unlocked · No credit card required
          </p>

          {/* Floating glass preview */}
          <div className="relative mt-16 w-full max-w-4xl">
            <div className="glass-card animate-fade-up rounded-3xl p-4 text-left md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-muted-foreground">
                  Tuvoria · Today’s lessons
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Video, tint: 'from-indigo-500 to-violet-600', title: 'GCSE Maths — Group A', meta: 'Live · 4:00 PM' },
                  { icon: Users, tint: 'from-sky-500 to-blue-600', title: '1-to-1 · Amara', meta: 'Live · 5:30 PM' },
                  { icon: CalendarDays, tint: 'from-emerald-500 to-teal-600', title: 'Mock exam review', meta: 'Tomorrow · 10 AM' },
                ].map((c) => (
                  <div key={c.title} className="rounded-2xl border border-white/50 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.tint} text-white`}>
                      <c.icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-brand-900 dark:text-white">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.meta}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating chips */}
            <div className="glass absolute -left-4 top-10 hidden animate-float items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-brand-800 shadow-lg dark:text-brand-100 md:flex">
              <Flame className="h-4 w-4 text-orange-500" /> 7-day streak
            </div>
            <div className="glass absolute -right-4 bottom-8 hidden animate-float items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-brand-800 shadow-lg [animation-delay:-3s] dark:text-brand-100 md:flex">
              <Star className="h-4 w-4 text-amber-500" /> +120 points
            </div>
          </div>
        </section>
      </div>

      {/* Stats */}
      <section className="container -mt-6 pb-8">
        <div className="glass-card mx-auto grid max-w-3xl grid-cols-1 gap-6 rounded-3xl text-center sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="bg-gradient-to-br from-brand-700 to-violet-600 bg-clip-text text-3xl font-extrabold text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything your tutoring runs on</h2>
          <p className="mt-3 text-muted-foreground">
            Not just an LMS — a complete platform to manage, teach and grow your business.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, body, tint }) => (
            <div
              key={title}
              className="glass-card group rounded-3xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-md`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden py-20">
        <div className="blob left-1/4 top-0 h-80 w-80 animate-blob bg-violet-400/30" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
            <p className="mt-3 text-muted-foreground">
              No course-building maze. Create a class, add your link, and teach live.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="glass-card rounded-3xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-extrabold text-white dark:bg-white dark:text-brand-900">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="container py-8">
        <div className="glass-card mx-auto max-w-3xl rounded-3xl text-center">
          <div className="mb-3 flex justify-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <p className="text-lg font-medium text-foreground md:text-xl">
            “Tuvoria replaced three tools. My learners join their live lessons in one tap, parents
            can see progress, and I finally get paid on time.”
          </p>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            A tutor running a growing online academy
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-violet-700 p-10 text-center text-white shadow-2xl shadow-brand-900/30 md:p-16">
          <div className="blob left-10 top-0 h-64 w-64 bg-fuchsia-400/40" />
          <div className="blob bottom-0 right-10 h-64 w-64 bg-sky-400/40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              Run your tutoring business from one platform
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Start free with every feature unlocked for 14 days. Add learners, teach live, and only
              pay for the seats you use as you grow.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="shadow-lg">
                <Link href="/signup">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="inline-flex items-center gap-2 text-sm text-brand-100">
                <ShieldCheck className="h-4 w-4" /> No credit card required
              </span>
            </div>
            <ul className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100">
              {['All features in trial', 'Cancel anytime', 'Live online lessons'].map((f) => (
                <li key={f} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
