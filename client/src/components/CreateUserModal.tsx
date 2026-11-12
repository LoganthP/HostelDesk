import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api, errorMessage } from '../lib/api';
import { SPECIALIZATIONS } from '../lib/constants';
import type { Role, User } from '../lib/types';
import { Button, Field, Input, Modal, Select } from './ui';

const EMPTY = { name: '', email: '', password: '', phone: '', rollNumber: '', specialization: 'general' };

export function CreateUserModal({ open, onClose, onCreated, roles }: {
  open: boolean; onClose: () => void; onCreated: (u: User) => void; roles: Role[];
}) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [role, setRole] = useState<Role>(roles[0]);
  const [busy, setBusy] = useState(false);
  const firstRole = roles[0];
  useEffect(() => { if (open) { setForm(EMPTY); setRole(firstRole); } }, [open, firstRole]);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    try {
      const { user } = await api.post<{ user: User }>('/users', { ...form, role });
      toast.success(`Account created for ${user.name}.`);
      onCreated(user);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const label = role === 'student' ? 'student' : role === 'maintenance' ? 'maintenance staff member' : 'warden';
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add a ${label}`}
      subtitle="Share the email and password with them so they can sign in."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={<UserPlus className="h-4 w-4" />} loading={busy} onClick={submit} disabled={!form.name || !form.email || form.password.length < 6}>Create account</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.length > 1 && (
          <Field label="Role" className="sm:col-span-2">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) => <option key={r} value={r}>{r === 'maintenance' ? 'Maintenance staff' : r === 'warden' ? 'Warden' : 'Student'}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Full name" className="sm:col-span-2"><Input value={form.name} onChange={set('name')} /></Field>
        <Field label="Email" className="sm:col-span-2"><Input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Temporary password" hint="At least 6 characters."><Input value={form.password} onChange={set('password')} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="Optional" /></Field>
        {role === 'student' && <Field label="Roll number" className="sm:col-span-2"><Input value={form.rollNumber} onChange={set('rollNumber')} placeholder="Optional" /></Field>}
        {role === 'maintenance' && (
          <Field label="Specialization" className="sm:col-span-2">
            <Select value={form.specialization} onChange={set('specialization')}>
              {SPECIALIZATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
