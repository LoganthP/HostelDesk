import { Link } from 'react-router-dom';
import { ArrowRightLeft, BedDouble, DoorOpen, LogIn, Users } from 'lucide-react';
import clsx from 'clsx';
import { useFetch } from '../../hooks/useFetch';
import type { Allocation } from '../../lib/types';
import { floorName, formatDate } from '../../lib/format';
import { buttonClass, Card, EmptyState, ErrorState, PageHeader, PageLoader } from '../../components/ui';

interface MyRoomData {
  current: Allocation | null;
  history: Allocation[];
  roommates: { bedLabel: string; name?: string; rollNumber?: string }[];
}

export default function MyRoom() {
  const { data, loading, error, reload } = useFetch<MyRoomData>('/allocations/me');
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? 'Could not load your room.'} onRetry={reload} />;
  const { current, history, roommates } = data;

  return (
    <>
      <PageHeader title="My room" subtitle="Your current bed and every room you've stayed in." />
      {!current ? (
        <Card>
          <EmptyState icon={DoorOpen} title="You don't have a room yet" text="The warden allocates beds. Once that happens, your room appears here and complaints can be filed for it." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-500">Block {current.roomId.block}, {floorName(current.roomId.floor)}</div>
                <div className="font-display text-6xl font-extrabold text-ink">{current.roomId.roomNumber}</div>
              </div>
              <Link to="/complaints/new" className={buttonClass('secondary')}>Report an issue in this room</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="clay-tile flex items-center gap-3 rounded-2xl bg-indigo-500 px-4 py-3 text-white">
                <BedDouble className="h-5 w-5" />
                <div>
                  <div className="text-xs opacity-80">Your bed</div>
                  <div className="font-display text-xl font-bold">{current.bedLabel}</div>
                </div>
              </div>
              <div className="clay-tile flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <LogIn className="h-5 w-5 text-indigo-500" />
                <div>
                  <div className="text-xs text-slate-500">Moved in</div>
                  <div className="text-sm font-bold text-ink">{formatDate(current.startDate, false)}</div>
                </div>
              </div>
            </div>
          </Card>
          <Card delay={0.05}>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold">Roommates</h2>
            </div>
            {roommates.length === 0 ? (
              <p className="text-sm text-slate-500">Nobody else is in this room right now.</p>
            ) : (
              <ul className="space-y-2">
                {roommates.map((r) => (
                  <li key={r.bedLabel} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 ring-1 ring-white">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">{r.bedLabel}</span>
                    <div>
                      <div className="text-sm font-bold text-ink">{r.name}</div>
                      {r.rollNumber && <div className="text-xs text-slate-500">{r.rollNumber}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <Card delay={0.1} className="mt-4">
          <h2 className="mb-4 text-lg font-bold">Room history</h2>
          <AllocationHistory items={history} />
        </Card>
      )}
    </>
  );
}

export function AllocationHistory({ items }: { items: Allocation[] }) {
  return (
    <ol className="space-y-3">
      {items.map((a) => (
        <li key={a._id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-white">
          <span className={clsx('grid h-9 w-9 place-items-center rounded-xl', a.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
            {a.endReason === 'transfer' ? <ArrowRightLeft className="h-4 w-4" /> : <BedDouble className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink">
              Room {a.roomId?.roomNumber ?? 'removed'}, bed {a.bedLabel}
              <span className="font-normal text-slate-500"> in Block {a.roomId?.block}</span>
            </div>
            <div className="text-xs text-slate-500">
              {formatDate(a.startDate, false)} to {a.endDate ? formatDate(a.endDate, false) : 'now'}
            </div>
          </div>
          <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-bold', a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
            {a.status === 'active' ? 'Current' : a.endReason === 'transfer' ? 'Transferred out' : 'Checked out'}
          </span>
        </li>
      ))}
    </ol>
  );
}
