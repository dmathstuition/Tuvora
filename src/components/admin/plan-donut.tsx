'use client';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { PlanSlice } from '@/services/admin';

// Brand-aligned categorical palette (indigo family + accents).
const COLORS = ['hsl(239 58% 57%)', 'hsl(217 91% 60%)', 'hsl(152 60% 40%)', 'hsl(38 92% 50%)', 'hsl(280 60% 55%)'];

export function PlanDonut({ data }: { data: PlanSlice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ name: 'None', count: 1 }]}
              dataKey="count"
              nameKey="name"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
            >
              {(data.length ? data : [{ name: 'None', count: 1 }]).map((_, i) => (
                <Cell key={i} fill={data.length ? COLORS[i % COLORS.length] : 'hsl(var(--muted))'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {data.length === 0 && <li className="text-muted-foreground">No active subscriptions yet.</li>}
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {d.name}
            </span>
            <span className="text-muted-foreground">
              {d.count} ({total ? Math.round((d.count / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
