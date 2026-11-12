import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/api';
import { Backdrop } from '../components/Layout';
import { Button, Field, Input } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', rollNumber: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const { confirm: _c, ...payload } = form;
      void _c;
      await register(payload);
      toast.success('Account created. The warden will allocate your room.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <Backdrop />
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 24 }} className="glass-strong w-full max-w-xl p-7 sm:p-9">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-3xl font-extrabold">Create a student account</h1>
        <p className="mt-1 text-slate-500">Wardens and maintenance staff get their accounts from the hostel office.</p>
        <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2">
            <Input required value={form.name} onChange={set('name')} placeholder="e.g. Ananya Rao" autoComplete="name" />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <Input type="email" required value={form.email} onChange={set('email')} placeholder="you@student.edu" autoComplete="email" />
          </Field>
          <Field label="Roll number">
            <Input value={form.rollNumber} onChange={set('rollNumber')} placeholder="Optional" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="Optional" autoComplete="tel" />
          </Field>
          <Field label="Password">
            <Input type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="At least 6 characters" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </Field>
          {error && <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100 sm:col-span-2">{error}</p>}
          <Button type="submit" size="lg" loading={busy} icon={<UserPlus className="h-4 w-4" />} className="sm:col-span-2">
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </motion.section>
    </div>
  );
}
