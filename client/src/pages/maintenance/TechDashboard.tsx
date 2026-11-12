import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, Hammer, Play, Timer } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { api, errorMessage } from '../../lib/api';
import { CATEGORY_MAP, PRIORITY_META } from '../../lib/constants';
import type { Complaint } from '../../lib/types';
import { firstName, locationText, timeAgo } from '../../lib/format';
import { ComplaintRow } from '../../components/ComplaintRow';
import { Button, Card, EmptyState, ErrorState, Metric, PageLoader, PriorityBadge, StatusBadge } from '../../components/ui';

export default function TechDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch<{ complaints: Complaint[] }>('/complaints');
  const [starting, setStarting] = useState<string | null>(null);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;

  const jobs = data?.complaints ?? [];
  const byPriority = (a: Complaint, b: Complaint) => PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;
  const todo = jobs.filter((j) => j.status === 'assigned').sort(byPriority);
  const doing = jobs.filter((j) => j.status === 'in_progress').sort(byPriority);
  const done = jobs.filter((j) => j.status === 'resolved' || j.status === 'closed');
  const queue = [...doing, ...todo];

  async function start(id: string) {
    setStarting(id);
    try {
      await api.patch(`/complaints/${id}/start`);
      toast.success('Work started.');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="grid auto-rows-min grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <Card className="col-span-2 md:col-span-2">
        <p className="font-semibold text-indigo-600">Hi, {firstName(user?.name)}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          {queue.length ? `${queue.length} ${queue.length === 1 ? 'job' : 'jobs'} on your list.` : 'No jobs waiting right now.'}
        </h1>
        <p className="mt-2 text-slate-500">Start a job when you begin, and add a repair note when you resolve it.</p>
      </Card>
      <Metric delay={0.04} icon={Timer} tone="bg-indigo-100 text-indigo-600" label="Waiting to start" value={todo.length} />
      <Metric delay={0.08} icon={Hammer} tone="bg-amber-100 text-amber-600" label="In progress" value={doing.length} />

      <Card delay={0.12} className="col-span-2 md:col-span-4">
        <h2 className="mb-4 text-lg font-bold">Up next</h2>
        {queue.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="You're all caught up" text="New jobs from the warden will appear here." />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {queue.map((j) => {
              const cat = CATEGORY_MAP[j.category];
              return (
                <li key={j._id} className={clsx('rounded-3xl bg-white/75 p-4 ring-1', j.priority === 'urgent' ? 'ring-red-200' : 'ring-white')}>
                  <div className="flex items-start gap-3">
                    <span className={`clay-tile grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cat.tile}`}><cat.icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/complaints/${j._id}`} className="font-bold text-ink hover:underline">{j.title}</Link>
                      <div className="text-sm text-slate-500">{locationText(j.location)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={j.status} />
                        <PriorityBadge priority={j.priority} />
                        <span className="text-xs text-slate-400">{timeAgo(j.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    {j.status === 'assigned' ? (
                      <Button size="sm" icon={<Play className="h-4 w-4" />} loading={starting === j._id} onClick={() => start(j._id)}>Start work</Button>
                    ) : (
                      <Link to={`/complaints/${j._id}`} className="inline-flex h-9 items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-3.5 text-sm font-semibold text-white clay-btn">
                        <CheckCircle2 className="h-4 w-4" /> Resolve
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {done.length > 0 && (
        <Card delay={0.16} className="col-span-2 md:col-span-4">
          <h2 className="mb-4 text-lg font-bold">Recently finished</h2>
          <ul className="space-y-3">{done.slice(0, 5).map((c, i) => <ComplaintRow key={c._id} c={c} index={i} />)}</ul>
        </Card>
      )}
    </div>
  );
}
