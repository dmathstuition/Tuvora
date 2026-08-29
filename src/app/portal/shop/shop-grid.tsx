'use client';

import { useActionState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { redeemAction, type RedeemState, type ShopItem, type Wallet } from '@/services/rewards/shop';
import { cn } from '@/lib/utils';

const ACCENTS = [
  'from-blue-500 to-indigo-600',
  'from-fuchsia-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-cyan-600',
];

export function ShopGrid({ items, wallet }: { items: ShopItem[]; wallet: Wallet }) {
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemAction, {});

  return (
    <div className="space-y-4">
      {state.error && (
        <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600">
          {state.success}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-bold text-brand-800">The shop is empty right now</p>
          <p className="text-sm text-slate-400">Your academy will stock rewards soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, i) => {
            const canAfford = wallet.spendable >= item.cost;
            const soldOut = item.stock != null && item.stock <= 0;
            const disabled = !canAfford || soldOut || pending;
            return (
              <div key={item.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className={cn('flex h-24 items-center justify-center bg-gradient-to-br text-5xl', ACCENTS[i % ACCENTS.length])}>
                  {item.emoji || '🎁'}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-sm font-extrabold text-brand-900">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{item.description}</p>
                  )}
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {item.stock != null ? `${item.stock} left` : 'In stock'}
                  </p>
                  <form action={action} className="mt-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <button
                      type="submit"
                      disabled={disabled}
                      className={cn(
                        'flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-sm font-extrabold transition',
                        disabled
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-gradient-to-r from-brand-500 to-violet-600 text-white hover:opacity-90',
                      )}
                    >
                      {soldOut ? (
                        'Sold out'
                      ) : !canAfford ? (
                        <>
                          <Lock className="h-3.5 w-3.5" /> {item.cost}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" /> {item.cost}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
