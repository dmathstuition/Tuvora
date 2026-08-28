import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { getLeaderboard } from '@/services/rewards';
import { levelFromPoints, avatarFor } from '@/constants/gamification';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Leaderboard' };

const medal = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage() {
  const ctx = await getAuthContext();
  if (!ctx || !can(ctx, 'rewards.view')) {
    return (
      <EmptyState
        icon={Trophy}
        title="Leaderboard isn't available for your role"
        description="Ask an owner or admin for access."
      />
    );
  }

  const rows = await getLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Your academy&apos;s learners ranked by reward points.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No points awarded yet"
          description="Award reward points to learners from their profile to build the leaderboard."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {rows.map((r) => {
                const avatar = avatarFor(r.avatarKey);
                const level = levelFromPoints(r.points);
                return (
                  <li
                    key={r.learnerId}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3',
                      r.rank <= 3 && 'bg-muted/40',
                    )}
                  >
                    <span className="w-8 text-center text-lg font-bold">
                      {medal[r.rank - 1] ?? r.rank}
                    </span>
                    <span className="text-2xl" aria-hidden>
                      {avatar.emoji}
                    </span>
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/learners/${r.learnerId}`}
                        className="font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">Level {level.level}</p>
                    </div>
                    <span className="text-lg font-bold">{r.points}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
