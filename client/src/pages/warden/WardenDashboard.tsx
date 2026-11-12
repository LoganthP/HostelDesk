import { Link } from 'react-router-dom';
import { AlertOctagon, BedDouble, ClipboardList, GraduationCap, Inbox, Siren, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { STATUS_META } from '../../lib/constants';
import type { Complaint, ComplaintStatus, Summary } from '../../lib/types';
import { firstName } from '../../lib/format';
import { ComplaintRow } from '../../components/ComplaintRow';
import { Card, EmptyState, ErrorState, Metric, PageLoader, Spinner } from '../../components/ui';

interface OccupancyRow { block: string; beds: number; occupied: number; occupancyRate: number }
const ORDER: ComplaintStatus[] = ['submitted', 'reopened', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function WardenDashboard() {
  const { user } = useAuth();
  const summary = useFetch<Summary>('/reports/summary');
  const occupancy = useFetch<{ rows: OccupancyRow[] }>('/reports/occupancy');
  const queue = useFetch<{ complaints: Complaint[] }>('/complaints?status=submitted,reopened&limit=6');

  if (summary.error && !summary.data) return <ErrorState message={summary.error} onRetry={summary.reload} />;
  if (!summary.data) return <PageLoader />;
  const s = summary.data;
  const occRate = s.beds ? Math.round((s.occupied / s.beds) * 100) : 0;
  const maxStatus = Math.max(1, ...ORDER.map((k) => s.complaints.byStatus[k] ?? 0));

  return (
    <div className="grid auto-rows-min grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <Card className="col-span-2 md:col-span-2">
        <p className="font-semibold text-indigo-600">Good to see you, {firstName(user?.name)}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          {s.complaints.needsAssignment ? `${s.complaints.needsAssignment} ${s.complaints.needsAssignment === 1 ? 'complaint needs' : 'complaints need'} a technician.` : 'Every complaint has an owner.'}
        </h1>
        <p className="mt-2 text-slate-500">{s.complaints.open} open in total across {s.rooms} rooms.</p>
      </Card>
      <Metric delay={0.04} icon={Siren} tone="bg-red-100 text-red-600" label="Urgent and unresolved" value={s.complaints.urgentOpen} />
      <Metric delay={0.08} icon={BedDouble} tone="bg-violet-100 text-violet-600" label="Beds occupied" value={`${occRate}%`} hint={`${s.occupied} of ${s.beds}, ${s.available} free`} />

      <Card delay={0.1} className="col-span-2 md:col-span-2 md:row-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Needs assignment</h2>
          <Link to="/complaints" className="text-sm font-semibold text-indigo-600 hover:underline">All complaints</Link>
        </div>
        {queue.loading && !queue.data ? (
          <PageLoader />
        ) : queue.error && !queue.data ? (
          <p className="text-sm text-rose-600">{queue.error}</p>
        ) : (queue.data?.complaints.length ?? 0) === 0 ? (
          <EmptyState icon={Inbox} title="Queue is clear" text="New and reopened complaints will appear here." />
        ) : (
          <ul className="space-y-3">{queue.data!.complaints.map((c, i) => <ComplaintRow key={c._id} c={c} index={i} showStudent />)}</ul>
        )}
      </Card>

      <Card delay={0.14} className="col-span-2 md:col-span-2">
        <h2 className="mb-4 text-lg font-bold">Complaints by status</h2>
        <ul className="space-y-2.5">
          {ORDER.map((k) => {
            const n = s.complaints.byStatus[k] ?? 0;
            return (
              <li key={k} className="grid grid-cols-[100px_1fr_32px] items-center gap-3 text-sm">
                <span className="font-semibold text-slate-600">{STATUS_META[k].label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${STATUS_META[k].dot}`} style={{ width: `${(n / maxStatus) * 100}%` }} />
                </span>
                <span className="text-right font-bold text-ink">{n}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card delay={0.18} className="col-span-2 md:col-span-2">
        <h2 className="mb-4 text-lg font-bold">Occupancy by block</h2>
        {occupancy.loading && !occupancy.data ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : occupancy.error && !occupancy.data ? (
          <p className="text-sm text-rose-600">{occupancy.error}</p>
        ) : (occupancy.data?.rows ?? []).length === 0 ? <p className="text-sm text-slate-500">Add rooms to see occupancy.</p> : (
          <div className="flex flex-wrap gap-3">
            {occupancy.data!.rows.map((r) => (
              <div key={r.block} className="clay-tile flex-1 rounded-2xl bg-white/80 p-4">
                <div className="text-sm font-semibold text-slate-500">Block {r.block}</div>
                <div className="font-display text-3xl font-extrabold text-ink">{r.occupancyRate}%</div>
                <div className="text-xs text-slate-500">{r.occupied} of {r.beds} beds</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Metric delay={0.22} icon={ClipboardList} tone="bg-sky-100 text-sky-600" label="Complaints logged" value={s.complaints.total} />
      <Metric delay={0.26} icon={Wrench} tone="bg-amber-100 text-amber-600" label="Active technicians" value={s.technicians} />
      <Metric delay={0.3} icon={AlertOctagon} tone="bg-rose-100 text-rose-600" label="Reopened" value={s.complaints.byStatus.reopened ?? 0} />
      <Metric delay={0.34} icon={GraduationCap} tone="bg-emerald-100 text-emerald-600" label="Students" value={s.students} />
    </div>
  );
}
