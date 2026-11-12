import { Plus, ShieldCheck, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { api, errorMessage } from '../../lib/api';
import { specLabel } from '../../lib/constants';
import type { Technician, User } from '../../lib/types';
import { CreateUserModal } from '../../components/CreateUserModal';
import { Button, Card, EmptyState, ErrorState, PageHeader, PageLoader } from '../../components/ui';
import { useState } from 'react';

export default function StaffPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const techs = useFetch<{ technicians: Technician[] }>('/users/technicians');
  const wardens = useFetch<{ users: User[] }>('/users?role=warden');
  const [creating, setCreating] = useState(false);

  async function toggle(u: User) {
    try {
      await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? `${u.name} deactivated.` : `${u.name} reactivated.`);
      techs.reload();
      wardens.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const staffError = (techs.error && !techs.data) || (wardens.error && !wardens.data);
  if (staffError) return <ErrorState message={techs.error || wardens.error || ''} onRetry={() => { techs.reload(); wardens.reload(); }} />;
  if ((techs.loading && !techs.data) || (wardens.loading && !wardens.data)) return <PageLoader />;
  const list = techs.data?.technicians ?? [];

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Maintenance staff receive jobs. Their open jobs help you spread the work fairly."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>Add staff</Button>}
      />
      <h2 className="mb-3 text-lg font-bold">Maintenance staff</h2>
      {list.length === 0 ? (
        <Card><EmptyState icon={Wrench} title="No maintenance staff yet" text="Add technicians so you can assign complaints to them." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((t, i) => (
            <Card key={t._id} delay={i * 0.03} className={clsx(!t.isActive && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="clay-tile grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-600"><Wrench className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold text-ink">{t.name}</div>
                    <div className="text-sm text-slate-500">{specLabel(t.specialization)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-extrabold text-ink">{t.openJobs}</div>
                  <div className="text-xs font-semibold text-slate-500">open jobs</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span className="truncate">{t.phone || t.email}</span>
                <Button size="sm" variant="ghost" onClick={() => toggle(t)}>{t.isActive ? 'Deactivate' : 'Reactivate'}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold">Wardens</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(wardens.data?.users ?? []).map((w) => (
          <Card key={w._id} className={clsx('flex items-center gap-3', !w.isActive && 'opacity-60')}>
            <div className="clay-tile grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-600"><ShieldCheck className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink">{w.name}{w._id === me?._id && <span className="text-xs font-semibold text-indigo-500"> (you)</span>}</div>
              <div className="truncate text-sm text-slate-500">{w.email}</div>
            </div>
            {w._id !== me?._id && <Button size="sm" variant="ghost" onClick={() => toggle(w)}>{w.isActive ? 'Deactivate' : 'Reactivate'}</Button>}
          </Card>
        ))}
      </div>

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onCreated={() => { techs.reload(); wardens.reload(); }} roles={['maintenance', 'warden']} />
    </>
  );
}
