import type { Metadata } from 'next';
import { DemoShowcase } from './demo-showcase';

export const metadata: Metadata = {
  title: 'Live demo',
  description: 'See how Tuvora works — the tutor dashboard, the gamified learner portal and the academy leaderboard.',
};

export default function DemoPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">See Tuvora in action</h1>
        <p className="mt-3 text-muted-foreground">
          A live, interactive preview — switch between the tutor dashboard, the colourful learner
          portal and the academy leaderboard. No sign-up needed.
        </p>
      </div>
      <div className="mt-10">
        <DemoShowcase />
      </div>
    </div>
  );
}
