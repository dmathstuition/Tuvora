import Link from 'next/link';
import {
  ArrowRight,
  Users,
  CalendarDays,
  ClipboardCheck,
  LineChart,
  Wallet,
  MessagesSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const modules = [
  {
    icon: Users,
    title: 'Learner management',
    body: 'Rich learner profiles with performance, attendance and progress in one place.',
  },
  {
    icon: CalendarDays,
    title: 'Classes & scheduling',
    body: 'One-to-one and group classes, schedules and a unified calendar.',
  },
  {
    icon: ClipboardCheck,
    title: 'Assignments & assessments',
    body: 'Set work, run quizzes and exams, and grade with auto-marking where possible.',
  },
  {
    icon: LineChart,
    title: 'Progress & reports',
    body: 'Track performance over time and generate professional progress reports.',
  },
  {
    icon: Wallet,
    title: 'Payments & invoices',
    body: 'Collect payments from parents and learners, and keep on top of balances.',
  },
  {
    icon: MessagesSquare,
    title: 'Parent engagement',
    body: 'Give parents a portal into their children’s attendance, grades and progress.',
  },
];

const flow = [
  'Get learners',
  'Onboard',
  'Schedule',
  'Teach',
  'Assess',
  'Track',
  'Communicate',
  'Get paid',
  'Grow',
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container flex flex-col items-center py-20 text-center md:py-28">
          <Badge variant="secondary" className="mb-6">
            Manage. Teach. Grow.
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-brand-900 dark:text-foreground md:text-6xl">
            The operating system for tutors and tutoring businesses
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Tuvora brings learners, classes, assessments, progress, communication and payments
            together — so you can run your entire tutoring operation from one place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/demo">See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14-day free trial · No credit card required
          </p>
        </div>
      </section>

      {/* Operating-system flow */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="container py-10">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {flow.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border bg-background px-3 py-1 font-medium">
                  {step}
                </span>
                {i < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </span>
            ))}
          </div>
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
          {modules.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <Card className="overflow-hidden border-brand-200 bg-brand-900 text-white">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-14 text-center md:px-16">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
              Run your tutoring business from one platform
            </h2>
            <p className="max-w-xl text-brand-100">
              Start free, add learners, and only pay for the seats you use as you grow.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
