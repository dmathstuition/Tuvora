'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

/**
 * A donut with a centered primary/secondary label. Used for the attendance
 * average and subscription-usage widgets. When every value is zero we render a
 * single neutral ring so the chart never collapses to nothing.
 */
export function DonutChart({
  data,
  centerPrimary,
  centerSecondary,
  size = 176,
}: {
  data: DonutDatum[];
  centerPrimary: string;
  centerSecondary?: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData =
    total > 0 ? data : [{ name: 'Empty', value: 1, color: 'hsl(var(--muted))' }];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            paddingAngle={total > 0 ? 2 : 0}
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight">{centerPrimary}</span>
        {centerSecondary && (
          <span className="mt-0.5 text-xs text-muted-foreground">{centerSecondary}</span>
        )}
      </div>
    </div>
  );
}
