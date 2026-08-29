'use client';

import { useState, useTransition } from 'react';
import { Gift, Check } from 'lucide-react';
import { claimDailyRewardAction } from '@/services/portal';

/**
 * Daily reward chest. Claims +5 points once per day; flips to a claimed state
 * for the rest of the day. Uses the Tuvora brand gradient.
 */
export function RewardChest({ claimed }: { claimed: boolean }) {
  const [done, setDone] = useState(claimed);
  const [pending, start] = useTransition();

  function open() {
    start(async () => {
      const res = await claimDailyRewardAction();
      if (res.earned || res.alreadyClaimed) setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-4 rounded-3xl bg-brand-900 p-5 text-white">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Check className="h-7 w-7" />
        </span>
        <div className="flex-1">
          <p className="text-lg font-extrabold">+5 points today! 🪙</p>
          <p className="text-sm text-white/70">Come back tomorrow for another chest.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-500 to-violet-600 p-5 text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
        <Gift className="h-7 w-7" />
      </span>
      <div className="flex-1">
        <p className="text-lg font-extrabold">Your daily reward is ready!</p>
        <p className="text-sm text-white/80">Open the chest for +5 points 🪙</p>
      </div>
      <button
        onClick={open}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand-700 shadow hover:bg-white/90 disabled:opacity-70"
      >
        {pending ? 'Opening…' : 'Open'} <Gift className="h-4 w-4" />
      </button>
    </div>
  );
}
