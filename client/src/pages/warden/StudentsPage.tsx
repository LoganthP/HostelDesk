import { useMemo, useState } from 'react';
import { ArrowRightLeft, BedDouble, GraduationCap, History, LogOut, Plus, Search } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';
import { useDebounced, useFetch } from '../../hooks/useFetch';
import { api, errorMessage } from '../../lib/api';
import type { StudentRow } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { AllocateModal, CheckoutModal, HistoryModal, TransferModal } from '../../components/AllocationModals';
import { CreateUserModal } from '../../components/CreateUserModal';
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, PageLoader, Segmented } from '../../components/ui';

type Filter = 'all' | 'allocated' | 'unallocated';
type Action = 'allocate' | 'transfer' | 'checkout' | 'history';

const roomLabel = (s: StudentRow) => (s.currentAllocation ? `Room ${s.currentAllocation.roomId.roomNumber}, bed ${s.currentAllocation.bedLabel}` : '');

export default function StudentsPage() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const search = useDebounced(q);
  const { data, loading, error, reload } = useFetch<{ users: StudentRow[] }>(`/users?role=student${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''}`);
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [action, setAction] = useState<{ type: Action; student: StudentRow } | null>(null);
  const close = () => setAction(null);

  const students = useMemo(() => data?.users ?? [], [data]);
  const visible = students.filter((s) => (filter === 'all' ? true : filter === 'allocated' ? !!s.currentAllocation : !s.currentAllocation));

  async function toggleActive(s: StudentRow) {
    try {
      await api.patch(`/users/${s._id}`, { isActive: !s.isActive });
      toast.success(s.isActive ? `${s.name}'s account deactivated.` : `${s.name}'s account reactivated.`);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Allocate beds, move students between rooms and check them out."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>Add student</Button>}
      />
      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: data ? students.length : undefined },
            { value: 'allocated', label: 'In a room', count: data ? students.filter((s) => s.currentAllocation).length : undefined },
            { value: 'unallocated', label: 'Without a room', count: data ? students.filter((s) => !s.currentAllocation).length : undefined },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or roll number" className="pl-10" aria-label="Search students" />
        </div>
      </Card>

      {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <PageLoader /> : visible.length === 0 ? (
        <Card><EmptyState icon={GraduationCap} title="No students found" text="Students can register themselves, or you can add them here." /></Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => (
            <li key={s._id} className={clsx('glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center', !s.isActive && 'opacity-60')}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 font-display text-lg font-bold text-ink">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">{s.name} {!s.isActive && <span className="text-xs font-semibold text-rose-500">(deactivated)</span>}</div>
                  <div className="truncate text-sm text-slate-500">{s.email}{s.rollNumber ? `, ${s.rollNumber}` : ''}</div>
                </div>
              </div>
              <div className="sm:w-56">
                {s.currentAllocation ? (
                  <div>
                    <div className="text-sm font-bold text-indigo-700">{roomLabel(s)}</div>
                    <div className="text-xs text-slate-500">Block {s.currentAllocation.roomId.block}, since {formatDate(s.currentAllocation.startDate, false)}</div>
                  </div>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">No room</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.currentAllocation ? (
                  <>
                    <Button size="sm" icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setAction({ type: 'transfer', student: s })}>Transfer</Button>
                    <Button size="sm" variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => setAction({ type: 'checkout', student: s })}>Check out</Button>
                  </>
                ) : (
                  <Button size="sm" variant="success" icon={<BedDouble className="h-4 w-4" />} disabled={!s.isActive} onClick={() => setAction({ type: 'allocate', student: s })}>Allocate</Button>
                )}
                <Button size="sm" variant="ghost" icon={<History className="h-4 w-4" />} onClick={() => setAction({ type: 'history', student: s })}>History</Button>
                {!s.currentAllocation && (
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(s)}>{s.isActive ? 'Deactivate' : 'Reactivate'}</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onCreated={reload} roles={['student']} />
      <AllocateModal open={action?.type === 'allocate'} onClose={close} onDone={reload} student={action?.type === 'allocate' ? action.student : null} />
      <TransferModal open={action?.type === 'transfer'} onClose={close} onDone={reload} student={action?.type === 'transfer' ? action.student : null} currentLabel={action ? roomLabel(action.student) : undefined} />
      <CheckoutModal open={action?.type === 'checkout'} onClose={close} onDone={reload} student={action?.type === 'checkout' ? action.student : null} currentLabel={action ? roomLabel(action.student) : undefined} />
      <HistoryModal open={action?.type === 'history'} onClose={close} student={action?.type === 'history' ? action.student : null} />
    </>
  );
}
