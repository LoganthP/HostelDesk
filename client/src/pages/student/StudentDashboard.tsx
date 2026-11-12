import { Link } from 'react-router-dom';
import { BedDouble, CheckCircle2, ClipboardList, Hourglass, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import type { Allocation, Complaint } from '../../lib/types';
import { firstName, floorName, formatDate } from '../../lib/format';
import { ComplaintRow } from '../../components/ComplaintRow';
import { buttonClass, Card, EmptyState, ErrorState, Metric, PageLoader } from '../../components/ui';

export default function StudentDashboard() {
  const { user } = useAuth();
  const room = useFetch<{ current: Allocation | null }>('/allocations/me');
  const list = useFetch<{ complaints: Complaint[] }>('/complaints');

  if ((room.loading && !room.data) || (list.loading && !list.data)) return <PageLoader />;
  if (room.error || list.error) return <ErrorState message={room.error || list.error || ''} onRetry={() => { room.reload(); list.reload(); }} />;

  const complaints = list.data?.complaints ?? [];
  const current = room.data?.current ?? null;
  const open = complaints.filter((c) => ['submitted', 'assigned', 'in_progress', 'reopened'].includes(c.status));
  const toConfirm = complaints.filter((c) => c.status === 'resolved');
  const closed = complaints.filter((c) => c.status === 'closed');

  return (
    <div className="grid auto-rows-min grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <Card className="relative overflow-hidden col-span-2 md:col-span-3 md:row-span-1">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-200 to-cyan-100 opacity-70 blur-2xl" aria-hidden />
        <div className="relative">
          <p className="font-semibold text-indigo-600">Hello, {firstName(user?.name)}</p>
          <h1 className="mt-1 max-w-xl text-3xl font-extrabold sm:text-4xl">Something broken? Tell us and follow it until it's fixed.</h1>
          <Link to="/complaints/new" className={buttonClass('primary', 'lg', 'mt-6')}>
            <Plus className="h-5 w-5" /> Report an issue
          </Link>
        </div>
      </Card>

      <Card delay={0.05} className="col-span-2 flex flex-col justify-between bg-gradient-to-br from-white/80 to-indigo-50/70 md:col-span-1">
        <div className="clay-tile grid h-11 w-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-600">
          <BedDouble className="h-5 w-5" />
        </div>
        {current ? (
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-500">Your room</div>
            <div className="font-display text-4xl font-extrabold text-ink">{current.roomId.roomNumber}</div>
            <div className="text-sm text-slate-600">Block {current.roomId.block}, {floorName(current.roomId.floor)}, bed {current.bedLabel}</div>
            <Link to="/my-room" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline">Room details</Link>
          </div>
        ) : (
          <div className="mt-4">
            <div className="font-display text-xl font-bold text-ink">No room yet</div>
            <p className="text-sm text-slate-500">The warden will allocate your bed. You can still report issues in shared areas.</p>
          </div>
        )}
      </Card>

      <Metric delay={0.08} icon={Hourglass} tone="bg-amber-100 text-amber-600" label="Open complaints" value={open.length} />
      <Metric delay={0.11} icon={Sparkles} tone="bg-emerald-100 text-emerald-600" label="Awaiting your confirmation" value={toConfirm.length} />
      <Metric delay={0.14} icon={CheckCircle2} tone="bg-teal-100 text-teal-700" label="Closed" value={closed.length} />
      <Metric delay={0.17} icon={ClipboardList} tone="bg-violet-100 text-violet-600" label="Reported in total" value={complaints.length} />

      {toConfirm.length > 0 && (
        <Card delay={0.2} className="col-span-2 md:col-span-4 ring-2 ring-emerald-200">
          <h2 className="text-lg font-bold">Check these repairs</h2>
          <p className="mb-4 text-sm text-slate-500">Confirm the fix or reopen the complaint if the problem is still there.</p>
          <ul className="space-y-3">{toConfirm.map((c, i) => <ComplaintRow key={c._id} c={c} index={i} />)}</ul>
        </Card>
      )}

      <Card delay={0.22} className="col-span-2 md:col-span-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent complaints</h2>
          {complaints.length > 0 && <Link to="/complaints" className="text-sm font-semibold text-indigo-600 hover:underline">See all</Link>}
        </div>
        {complaints.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No complaints yet" text="Your reported issues will show up here with their latest status." />
        ) : (
          <ul className="space-y-3">{complaints.slice(0, 4).map((c, i) => <ComplaintRow key={c._id} c={c} index={i} />)}</ul>
        )}
        {current && <p className="mt-4 text-xs text-slate-400">Living in {current.roomId.roomNumber} since {formatDate(current.startDate, false)}</p>}
      </Card>
    </div>
  );
}
