import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, Hammer, MapPin, MessageSquarePlus, Play, RotateCcw, ShieldCheck, UserRound, UserRoundCog, Wrench,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { api, errorMessage } from '../lib/api';
import { CATEGORY_MAP, DETAIL_LABELS, PRIORITIES, PRIORITY_META, ROLE_LABEL, SPECIALIZATIONS, specLabel } from '../lib/constants';
import { complaintCode, formatDate, locationText, timeAgo } from '../lib/format';
import type { Complaint, Priority, Technician } from '../lib/types';
import { HistoryList, StatusRail } from '../components/Timeline';
import {
  Button, Card, ErrorState, Field, Modal, PageLoader, PriorityBadge, Select, StatusBadge, Textarea,
} from '../components/ui';

function InfoRow({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 text-slate-500 ring-1 ring-white">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-ink">{children}</div>
      </div>
    </div>
  );
}

function Hint({ children, tone = 'indigo' }: { children: ReactNode; tone?: 'indigo' | 'emerald' | 'rose' | 'amber' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-800 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-800 ring-rose-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  };
  return <p className={clsx('rounded-2xl px-4 py-3 text-sm font-medium ring-1', tones[tone])}>{children}</p>;
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, setData, loading, error, reload } = useFetch<{ complaint: Complaint }>(`/complaints/${id}`);
  const c = data?.complaint;
  const role = user!.role;

  const canAssign = role === 'warden' && !!c && ['submitted', 'reopened', 'assigned', 'in_progress'].includes(c.status);
  const { data: techData, reload: reloadTechs } = useFetch<{ technicians: Technician[] }>(canAssign ? '/users/technicians' : null);

  const [busy, setBusy] = useState<string | null>(null);
  const [techId, setTechId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignNote, setAssignNote] = useState('');
  const [resolveNote, setResolveNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setTechId('');
    setAssignNote('');
    setResolveNote('');
    setNoteText('');
    setReopenOpen(false);
    setReason('');
  }, [id]);

  // Technicians whose specialization matches the category come first, then the least busy.
  const technicians = useMemo(() => {
    const list = (techData?.technicians ?? []).filter((t) => t.isActive);
    return list.sort((a, b) => {
      const score = (t: Technician) => (t.specialization === c?.category ? 0 : t.specialization === 'general' ? 1 : 2);
      return score(a) - score(b) || a.openJobs - b.openJobs;
    });
  }, [techData, c?.category]);

  const specialists = useMemo(() => technicians.filter((t) => t.specialization === c?.category), [technicians, c?.category]);
  const categoryHasSpecialty = SPECIALIZATIONS.some((s) => s.value === c?.category);
  useEffect(() => {
    if (c) setPriority(c.priority);
  }, [c]);

  useEffect(() => {
    if (!c) return;
    const assignedActive = c.assignedTo?._id && (!techData || technicians.some((t) => t._id === c.assignedTo?._id))
      ? c.assignedTo._id
      : '';
    setTechId((cur) => {
      const curActive = cur && (!techData || technicians.some((t) => t._id === cur)) ? cur : '';
      return curActive || assignedActive || specialists[0]?._id || '';
    });
  }, [c, techData, technicians, specialists]);

  async function act(key: string, method: 'patch' | 'post', path: string, body: object, success: string) {
    setBusy(key);
    try {
      const res = await api[method]<{ complaint: Complaint }>(`/complaints/${id}${path}`, body);
      setData({ complaint: res.complaint });
      if (path === '/assign') reloadTechs();
      toast.success(success);
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      reload();
      return false;
    } finally {
      setBusy(null);
    }
  }

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !c) return <PageLoader />;
  if (!c) return null;

  const cat = CATEGORY_MAP[c.category];
  const isOwner = role === 'student' && c.studentId?._id === user!._id;
  const isAssignee = role === 'maintenance' && c.assignedTo?._id === user!._id;
  const canNote = c.status !== 'closed' && (role === 'warden' || isAssignee);
  const details = Object.entries(c.details ?? {}).filter(([, v]) => v);
  const selectedTechIsCurrent = !!c.assignedTo && techId === c.assignedTo._id;

  /* ---------- Role-specific action panel ---------- */
  let actions: ReactNode = null;

  if (role === 'student' && isOwner) {
    if (c.status === 'resolved') {
      actions = (
        <div className="space-y-3">
          <Hint tone="emerald">The technician marked this as fixed. Check it and confirm, or reopen it if the problem is still there.</Hint>
          <div className="flex flex-wrap gap-2">
            <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} loading={busy === 'confirm'}
              onClick={() => act('confirm', 'patch', '/confirm', {}, 'Thanks! Complaint closed.')}>
              Confirm repair
            </Button>
            <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setReopenOpen(true)}>
              Reopen
            </Button>
          </div>
        </div>
      );
    } else if (c.status === 'closed') {
      actions = <Hint tone="emerald">This complaint is closed. Report a new issue if something else needs fixing.</Hint>;
    } else if (c.status === 'submitted' || c.status === 'reopened') {
      actions = <Hint>The warden will review this and assign a technician.</Hint>;
    } else {
      actions = <Hint tone="amber">{c.assignedTo?.name ?? 'A technician'} is handling this. You'll be able to confirm the repair once it's resolved.</Hint>;
    }
  }

  if (role === 'maintenance' && isAssignee) {
    if (c.status === 'assigned') {
      actions = (
        <div className="space-y-3">
          <Hint>This job is waiting for you. Start it when you begin the repair.</Hint>
          <Button icon={<Play className="h-4 w-4" />} loading={busy === 'start'} onClick={() => act('start', 'patch', '/start', {}, 'Work started.')}>
            Start work
          </Button>
        </div>
      );
    } else if (c.status === 'in_progress') {
      actions = (
        <div className="space-y-3">
          <Field label="Repair note" hint="What did you fix? The student sees this note.">
            <Textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="e.g. Replaced the tap washer and checked for leaks." />
          </Field>
          <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} loading={busy === 'resolve'} disabled={resolveNote.trim().length < 3}
            onClick={async () => { if (await act('resolve', 'patch', '/resolve', { note: resolveNote }, 'Marked as resolved.')) setResolveNote(''); }}>
            Mark as resolved
          </Button>
        </div>
      );
    } else if (c.status === 'resolved') {
      actions = <Hint tone="emerald">Resolved. Waiting for the student or warden to confirm.</Hint>;
    } else if (c.status === 'reopened') {
      actions = <Hint tone="rose">The student reopened this. The warden will reassign it.</Hint>;
    } else {
      actions = <Hint tone="emerald">Closed. Nice work.</Hint>;
    }
  }

  if (role === 'warden') {
    actions = (
      <div className="space-y-4">
        {c.status === 'reopened' && <Hint tone="rose">The student reopened this complaint. Assign a technician to follow up.</Hint>}
        {c.status === 'resolved' && (
          <div className="space-y-3">
            <Hint tone="emerald">The technician resolved this. Close it once you've verified the repair, or wait for the student to confirm.</Hint>
            <Button variant="success" icon={<ShieldCheck className="h-4 w-4" />} loading={busy === 'close'}
              onClick={() => act('close', 'patch', '/close', {}, 'Complaint closed.')}>
              Close complaint
            </Button>
          </div>
        )}
        {c.status === 'closed' && <Hint tone="emerald">This complaint is closed.</Hint>}
        {canAssign && techData && specialists.length === 0 && (
          <Hint tone="amber">
            {categoryHasSpecialty
              ? `No active ${specLabel(c.category)} staff. Assign general staff, or add a ${specLabel(c.category)} specialist under Staff. Until then it stays in Needs assignment.`
              : 'No specialist covers this category. Assign whoever fits best, or leave it in Needs assignment.'}
          </Hint>
        )}
        {canAssign && (
          <div className="space-y-3">
            <Field label="Technician">
              <Select value={techId} onChange={(e) => setTechId(e.target.value)}>
                <option value="">{technicians.length ? 'Choose a technician' : 'No active maintenance staff'}</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}, {specLabel(t.specialization)} ({t.openJobs} open {t.openJobs === 1 ? 'job' : 'jobs'})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={clsx('rounded-xl px-2 py-2 text-xs font-bold ring-1 transition', priority === p ? PRIORITY_META[p].badge : 'bg-white/70 text-slate-500 ring-white hover:text-ink')}>
                    {PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Note for the technician">
              <Textarea value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder="Optional" className="min-h-[70px]" />
            </Field>
            <Button className="w-full" icon={<UserRoundCog className="h-4 w-4" />} loading={busy === 'assign'} disabled={!techId}
              onClick={async () => {
                const ok = await act('assign', 'patch', '/assign', { assignedTo: techId, priority, note: assignNote },
                  selectedTechIsCurrent && !['submitted', 'reopened'].includes(c.status) ? 'Priority updated.' : 'Technician assigned.');
                if (ok) setAssignNote('');
              }}>
              {['submitted', 'reopened'].includes(c.status) ? 'Assign technician' : selectedTechIsCurrent ? 'Update priority' : 'Reassign technician'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Link to="/complaints" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to {role === 'maintenance' ? 'jobs' : 'complaints'}
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-start gap-4">
              <div className={clsx('clay-tile grid h-14 w-14 shrink-0 place-items-center rounded-2xl', cat.tile)}>
                <cat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-400">{cat.label} complaint {complaintCode(c._id)}</div>
                <h1 className="mt-0.5 text-2xl font-extrabold sm:text-3xl">{c.title}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  {!!c.reopenCount && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">Reopened {c.reopenCount}×</span>}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <StatusRail status={c.status} />
            </div>

            <p className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-700">{c.description}</p>

            {details.length > 0 && (
              <dl className="mt-5 grid gap-2 sm:grid-cols-2">
                {details.map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/70 px-4 py-2.5 ring-1 ring-white">
                    <dt className="text-xs font-semibold text-slate-500">{DETAIL_LABELS[k] ?? k}</dt>
                    <dd className="text-sm font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-6 grid gap-4 border-t border-white pt-5 sm:grid-cols-2">
              <InfoRow icon={MapPin} label={c.location.kind === 'room' ? 'Room (as reported)' : 'Shared area'}>{locationText(c.location)}</InfoRow>
              <InfoRow icon={UserRound} label="Reported by">
                {c.studentId?.name ?? 'Unknown'}{c.studentId?.rollNumber ? ` (${c.studentId.rollNumber})` : ''}
              </InfoRow>
              <InfoRow icon={Wrench} label="Technician">
                {c.assignedTo ? `${c.assignedTo.name}${c.assignedTo.phone ? `, ${c.assignedTo.phone}` : ''}` : 'Not assigned yet'}
              </InfoRow>
              <InfoRow icon={Clock} label="Reported">{formatDate(c.createdAt)}</InfoRow>
              {c.resolvedAt && <InfoRow icon={CheckCircle2} label="Resolved">{formatDate(c.resolvedAt)}</InfoRow>}
              {c.closedAt && <InfoRow icon={ShieldCheck} label="Closed">{formatDate(c.closedAt)}</InfoRow>}
            </div>
          </Card>

          <Card delay={0.05}>
            <div className="mb-4 flex items-center gap-2">
              <Hammer className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold">Repair notes</h2>
            </div>
            {(c.notes ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {[...(c.notes ?? [])].reverse().map((n) => (
                  <li key={n._id} className="rounded-2xl bg-white/70 p-4 ring-1 ring-white">
                    <p className="text-sm text-slate-700">{n.text}</p>
                    <div className="mt-1.5 text-xs text-slate-500">
                      {n.byName}{n.byRole && ` (${ROLE_LABEL[n.byRole]})`}, {timeAgo(n.at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {canNote && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a progress note…" className="min-h-[48px] flex-1" />
                <Button variant="secondary" icon={<MessageSquarePlus className="h-4 w-4" />} loading={busy === 'note'} disabled={!noteText.trim()} className="sm:self-end"
                  onClick={async () => { if (await act('note', 'post', '/notes', { text: noteText }, 'Note added.')) setNoteText(''); }}>
                  Add note
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          {actions && (
            <Card delay={0.08} className="border-indigo-100">
              <h2 className="mb-3 text-lg font-bold">{role === 'warden' ? 'Manage' : 'Next step'}</h2>
              {actions}
            </Card>
          )}
          <Card delay={0.12}>
            <h2 className="mb-4 text-lg font-bold">History</h2>
            <HistoryList history={c.statusHistory ?? []} />
          </Card>
        </div>
      </div>

      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen this complaint"
        subtitle="The warden will see your reason and assign someone to follow up."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} loading={busy === 'reopen'} disabled={reason.trim().length < 5}
              onClick={async () => {
                if (await act('reopen', 'patch', '/reopen', { reason }, 'Complaint reopened.')) { setReopenOpen(false); setReason(''); }
              }}>
              Reopen complaint
            </Button>
          </>
        }
      >
        <Field label="What's still wrong?" hint="At least 5 characters.">
          <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The tap started dripping again the next morning." />
        </Field>
      </Modal>
    </>
  );
}
