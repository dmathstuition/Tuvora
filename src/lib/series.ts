/** Time-series helpers shared by the org and platform overview dashboards. */

export interface SeriesPoint {
  label: string;
  value: number;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function monthBounds(offset = 0): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function weekLabel(time: number): string {
  return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Cumulative count of items at each of the last `points` weekly checkpoints. */
export function cumulativeByWeek(isoDates: string[], points = 5): SeriesPoint[] {
  const now = new Date();
  const times = isoDates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  const out: SeriesPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7).getTime();
    out.push({ label: weekLabel(cutoff), value: times.filter((t) => t <= cutoff).length });
  }
  return out;
}

/** Sum of amounts falling within each of the last `points` weekly buckets. */
export function sumByWeek(
  rows: { at: string; amt: number }[],
  points = 5,
  divisor = 1,
): SeriesPoint[] {
  const now = new Date();
  const out: SeriesPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7).getTime();
    const start = end - 7 * 24 * 60 * 60 * 1000;
    const sum = rows
      .filter((r) => {
        const t = new Date(r.at).getTime();
        return t > start && t <= end;
      })
      .reduce((s, r) => s + r.amt, 0);
    out.push({ label: weekLabel(end), value: Math.round(sum / divisor) });
  }
  return out;
}
