import Link from 'next/link';
import { LEARNER_FEATURES, FEATURE_GROUP_ORDER } from '@/constants/learner-features';
import { cn } from '@/lib/utils';

/**
 * The student "More" menu — every enabled feature, grouped. Live features link
 * out; "soon" features render with a badge. Features an academy has switched off
 * are simply absent.
 */
export function FeatureGrid({
  enabledKeys,
  groups = FEATURE_GROUP_ORDER as unknown as string[],
}: {
  enabledKeys: string[];
  groups?: string[];
}) {
  const enabled = new Set(enabledKeys);
  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const items = LEARNER_FEATURES.filter((f) => f.group === group && enabled.has(f.key));
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">{group}</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {items.map((f) => {
                const Icon = f.icon;
                const soon = f.status === 'soon';
                const tile = (
                  <div
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition',
                      soon ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-md',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                        f.accent,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-slate-600">
                      {f.label}
                    </span>
                    {soon && (
                      <span className="rounded-full bg-slate-100 px-1.5 text-[9px] font-bold uppercase text-slate-400">
                        Soon
                      </span>
                    )}
                  </div>
                );
                return soon ? (
                  <div key={f.key}>{tile}</div>
                ) : (
                  <Link key={f.key} href={f.href}>
                    {tile}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
