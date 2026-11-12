import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, BedDouble, LogOut } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { api, errorMessage } from '../lib/api';
import type { Allocation, AvailableBed, StudentRow, UserLite } from '../lib/types';
import { floorName } from '../lib/format';
import { AllocationHistory } from '../pages/student/MyRoom';
import { Button, Field, Modal, PageLoader, Select } from './ui';

/** Bed picker grouped by block and room. Value format: "roomId|bedLabel". */
function BedSelect({ beds, value, onChange }: { beds: AvailableBed[]; value: string; onChange: (v: string) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, AvailableBed[]>();
    beds.forEach((b) => {
      const key = `Block ${b.block}, ${floorName(b.floor)}`;
      map.set(key, [...(map.get(key) ?? []), b]);
    });
    return [...map.entries()];
  }, [beds]);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{beds.length ? 'Choose a free bed' : 'No free beds'}</option>
      {groups.map(([label, list]) => (
        <optgroup key={label} label={label}>
          {list.map((b) => (
            <option key={`${b.roomId}|${b.bedLabel}`} value={`${b.roomId}|${b.bedLabel}`}>Room {b.roomNumber}, bed {b.bedLabel}</option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}

/** Allocate: either a fixed bed (choose student) or a fixed student (choose bed). */
export function AllocateModal({ open, onClose, onDone, bed, student }: {
  open: boolean; onClose: () => void; onDone: () => void; bed?: AvailableBed | null; student?: UserLite | null;
}) {
  const toast = useToast();
  const students = useFetch<{ users: StudentRow[] }>(open && !student ? '/users?role=student&unallocated=true&active=true' : null);
  const beds = useFetch<{ beds: AvailableBed[] }>(open && !bed ? '/rooms/available-beds' : null);
  const [studentId, setStudentId] = useState('');
  const [bedValue, setBedValue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setStudentId(''); setBedValue(''); }
  }, [open]);

  async function submit() {
    const sid = student?._id ?? studentId;
    const [roomId, bedLabel] = bed ? [bed.roomId, bed.bedLabel] : bedValue.split('|');
    setBusy(true);
    try {
      await api.post<{ allocation: Allocation }>('/allocations', { studentId: sid, roomId, bedLabel });
      toast.success('Room allocated.');
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
      students.reload();
      beds.reload();
    } finally {
      setBusy(false);
    }
  }

  const ready = (student || studentId) && (bed || bedValue);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Allocate a bed"
      subtitle={bed ? `Room ${bed.roomNumber}, bed ${bed.bedLabel} (Block ${bed.block})` : student ? `For ${student.name}` : undefined}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={<BedDouble className="h-4 w-4" />} loading={busy} disabled={!ready} onClick={submit}>Allocate bed</Button></>}
    >
      <div className="space-y-4">
        {!student && (
          <Field label="Student" hint="Only students without a room are listed.">
            {students.loading && !students.data ? <PageLoader /> : students.error && !students.data ? <p className="text-sm text-rose-600">{students.error}</p> : (
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">{students.data?.users.length ? 'Choose a student' : 'Every student already has a room'}</option>
                {students.data?.users.map((s) => <option key={s._id} value={s._id}>{s.name}{s.rollNumber ? ` (${s.rollNumber})` : ''}</option>)}
              </Select>
            )}
          </Field>
        )}
        {!bed && (
          <Field label="Bed">
            {beds.loading && !beds.data ? <PageLoader /> : beds.error && !beds.data ? <p className="text-sm text-rose-600">{beds.error}</p> : <BedSelect beds={beds.data?.beds ?? []} value={bedValue} onChange={setBedValue} />}
          </Field>
        )}
      </div>
    </Modal>
  );
}

export function TransferModal({ open, onClose, onDone, student, currentLabel }: {
  open: boolean; onClose: () => void; onDone: () => void; student: UserLite | null; currentLabel?: string;
}) {
  const toast = useToast();
  const beds = useFetch<{ beds: AvailableBed[] }>(open ? '/rooms/available-beds' : null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setValue(''); }, [open]);

  async function submit() {
    if (!student) return;
    const [roomId, bedLabel] = value.split('|');
    setBusy(true);
    try {
      await api.post('/allocations/transfer', { studentId: student._id, roomId, bedLabel });
      toast.success(`${student.name} transferred. The old bed is free again.`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
      beds.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Transfer ${student?.name ?? 'student'}`}
      subtitle={currentLabel ? `Currently in ${currentLabel}. The move happens in one step, so nothing changes if it fails.` : undefined}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={<ArrowRightLeft className="h-4 w-4" />} loading={busy} disabled={!value} onClick={submit}>Transfer</Button></>}
    >
      <Field label="New bed">
        {beds.loading && !beds.data ? <PageLoader /> : beds.error && !beds.data ? <p className="text-sm text-rose-600">{beds.error}</p> : <BedSelect beds={beds.data?.beds ?? []} value={value} onChange={setValue} />}
      </Field>
    </Modal>
  );
}

export function CheckoutModal({ open, onClose, onDone, student, currentLabel }: {
  open: boolean; onClose: () => void; onDone: () => void; student: UserLite | null; currentLabel?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!student) return;
    setBusy(true);
    try {
      await api.post('/allocations/checkout', { studentId: student._id });
      toast.success(`${student.name} checked out. The bed is available.`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Check out ${student?.name ?? 'student'}?`}
      subtitle={currentLabel ? `This ends their stay in ${currentLabel}. Their room history is kept.` : undefined}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" icon={<LogOut className="h-4 w-4" />} loading={busy} onClick={submit}>Check out</Button></>}
    >
      <p className="text-sm text-slate-600">Complaints they filed keep pointing at the room they reported from.</p>
    </Modal>
  );
}

export function HistoryModal({ open, onClose, student }: { open: boolean; onClose: () => void; student: UserLite | null }) {
  const { data, loading, error } = useFetch<{ allocations: Allocation[] }>(open && student ? `/allocations/student/${student._id}` : null);
  return (
    <Modal open={open} onClose={onClose} title={`Room history`} subtitle={student?.name} wide>
      {loading && !data ? <PageLoader /> : error ? <p className="text-sm text-rose-600">{error}</p> : data?.allocations.length ? (
        <AllocationHistory items={data.allocations} />
      ) : (
        <p className="text-sm text-slate-500">No rooms allocated yet.</p>
      )}
    </Modal>
  );
}
