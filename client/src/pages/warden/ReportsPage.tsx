import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { CATEGORIES, CATEGORY_MAP } from '../../lib/constants';
import type { Category } from '../../lib/types';
import { hours } from '../../lib/format';
import { Card, EmptyState, ErrorState, PageHeader, PageLoader } from '../../components/ui';

interface CatBlockRow { block: string; category: Category; total: number; open: number }
interface ResolutionRow { category: Category; count: number; avgHours: number; minHours: number; maxHours: number }
interface OccupancyRow { block: string; rooms: number; beds: number; occupied: number; available: number; occupancyRate: number }

const tooltipStyle = { borderRadius: 16, border: '1px solid #fff', boxShadow: '0 12px 30px -12px rgba(79,70,229,.35)', fontSize: 13 };

export default function ReportsPage() {
  const catBlock = useFetch<{ rows: CatBlockRow[] }>('/reports/by-category-block');
  const resolution = useFetch<{ rows: ResolutionRow[] }>('/reports/resolution-time');
  const occupancy = useFetch<{ rows: OccupancyRow[] }>('/reports/occupancy');

  const stacked = useMemo(() => {
    const byBlock = new Map<string, Record<string, number | string>>();
    (catBlock.data?.rows ?? []).forEach((r) => {
      const row = byBlock.get(r.block) ?? { block: `Block ${r.block}` };
      row[r.category] = r.total;
      byBlock.set(r.block, row);
    });
    return [...byBlock.values()];
  }, [catBlock.data]);
  const usedCategories = useMemo(() => CATEGORIES.filter((c) => (catBlock.data?.rows ?? []).some((r) => r.category === c.value)), [catBlock.data]);
  const topProblems = useMemo(() => [...(catBlock.data?.rows ?? [])].sort((a, b) => b.total - a.total).slice(0, 5), [catBlock.data]);

  const error = catBlock.error || resolution.error || occupancy.error;
  if (error && !(catBlock.data && resolution.data && occupancy.data)) {
    return <ErrorState message={error} onRetry={() => { catBlock.reload(); resolution.reload(); occupancy.reload(); }} />;
  }
  if (!catBlock.data || !resolution.data || !occupancy.data) return <PageLoader label="Running aggregation reports…" />;

  const resRows = resolution.data.rows.map((r) => ({ ...r, label: CATEGORY_MAP[r.category]?.label ?? r.category }));
  const occRows = occupancy.data.rows.map((r) => ({ ...r, label: `Block ${r.block}` }));

  return (
    <>
      <PageHeader title="Reports" subtitle="Live MongoDB aggregation pipelines over complaints, rooms and allocations." />
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="text-lg font-bold">Where problems keep happening</h2>
          <p className="mb-4 text-sm text-slate-500">Complaints by hostel block and category.</p>
          {stacked.length === 0 ? <EmptyState icon={BarChart3} title="No complaints yet" /> : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="block" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {usedCategories.map((c, i) => (
                    <Bar key={c.value} dataKey={c.value} name={c.label} stackId="a" fill={c.chart} radius={i === usedCategories.length - 1 ? [8, 8, 0, 0] : 0} maxBarSize={56} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card delay={0.05} className="lg:col-span-2">
          <h2 className="text-lg font-bold">Top recurring problems</h2>
          <p className="mb-4 text-sm text-slate-500">Block and category pairs with the most complaints.</p>
          <ul className="space-y-2">
            {topProblems.map((r) => {
              const cat = CATEGORY_MAP[r.category];
              return (
                <li key={`${r.block}-${r.category}`} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 ring-1 ring-white">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${cat.tile}`}><cat.icon className="h-4 w-4" /></span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-ink">{cat.label} in Block {r.block}</div>
                    <div className="text-xs text-slate-500">{r.open} still open</div>
                  </div>
                  <span className="font-display text-2xl font-extrabold text-ink">{r.total}</span>
                </li>
              );
            })}
            {topProblems.length === 0 && <p className="text-sm text-slate-500">Nothing to report yet.</p>}
          </ul>
        </Card>

        <Card delay={0.1} className="lg:col-span-3">
          <h2 className="text-lg font-bold">Average time to resolve</h2>
          <p className="mb-4 text-sm text-slate-500">From submission to resolution, for complaints that have been resolved.</p>
          {resRows.length === 0 ? <EmptyState icon={BarChart3} title="No resolved complaints yet" /> : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resRows} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" h" />
                    <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,.06)' }} formatter={(v: number) => [hours(v), 'Average']} />
                    <Bar dataKey="avgHours" name="Average" fill="#6366F1" radius={[0, 10, 10, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 font-semibold">Category</th><th className="font-semibold">Resolved</th><th className="font-semibold">Average</th><th className="font-semibold">Fastest</th><th className="font-semibold">Slowest</th></tr></thead>
                  <tbody>
                    {resRows.map((r) => (
                      <tr key={r.category} className="border-t border-white">
                        <td className="py-2 font-semibold text-ink">{r.label}</td><td>{r.count}</td><td>{hours(r.avgHours)}</td><td>{hours(r.minHours)}</td><td>{hours(r.maxHours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card delay={0.15} className="lg:col-span-2">
          <h2 className="text-lg font-bold">Occupancy by block</h2>
          <p className="mb-4 text-sm text-slate-500">Bed counts compared with active allocations.</p>
          {occRows.length === 0 ? <EmptyState icon={BarChart3} title="No rooms yet" /> : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occRows} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
                    <Bar dataKey="occupied" name="Occupied" stackId="o" fill="#8B5CF6" maxBarSize={48} />
                    <Bar dataKey="available" name="Free" stackId="o" fill="#6EE7B7" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {occRows.map((r) => (
                  <li key={r.block} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm ring-1 ring-white">
                    <span className="font-bold text-ink">{r.label}</span>
                    <span className="text-slate-500">{r.occupied}/{r.beds} beds, {r.rooms} rooms</span>
                    <span className="font-display text-lg font-extrabold text-indigo-600">{r.occupancyRate}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
