import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, LogIn } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';
import { Backdrop } from '../components/Layout';
import { Button, Field, Input } from '../components/ui';

// Demo shortcuts for the seeded accounts (see server/src/seed.js).
const DEMO_PASSWORD = 'HostelDesk#Demo26';
const DEMO = [
  { label: 'Student', email: 'arjun@student.edu' },
  { label: 'Warden', email: 'warden@hostel.edu' },
  { label: 'Plumber', email: 'ravi@hostel.edu' },
  { label: 'Electrician', email: 'suresh@hostel.edu' },
  { label: 'IT support', email: 'it@hostel.edu' },
  { label: 'Carpenter', email: 'anil@hostel.edu' },
];

const JOURNEY = ['Reported', 'Plumber assigned', 'Being repaired', 'Fixed', 'Confirmed by you'];

/** The signature moment: a leaking-tap complaint travelling through its statuses. */
function Journey() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % (JOURNEY.length + 2)), 1100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="glass max-w-md p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink">Leaking tap, Room A101</div>
          <div className="text-xs text-slate-500">Plumbing complaint</div>
        </div>
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">High</span>
      </div>
      <ol className="space-y-2.5">
        {JOURNEY.map((label, i) => {
          const done = i < step;
          return (
            <li key={label} className="flex items-center gap-3">
              <motion.span
                animate={{ scale: done ? 1 : 0.85, backgroundColor: done ? '#6366F1' : '#E2E8F0' }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="grid h-6 w-6 place-items-center rounded-full text-white"
              >
                {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </motion.span>
              <span className={clsx('text-sm font-semibold transition-colors', done ? 'text-ink' : 'text-slate-400')}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; demoEmail?: string } | null;
  const [email, setEmail] = useState(() => state?.demoEmail ?? '');
  const [password, setPassword] = useState(() => (state?.demoEmail ? DEMO_PASSWORD : ''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const demoEmail = state?.demoEmail;
    if (!demoEmail) return;
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
    navigate(location.pathname, { replace: true, state: state?.from ? { from: state.from } : null });
  }, [state, location.pathname, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <Backdrop />
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} className="hidden lg:block">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-indigo-700 ring-1 ring-white">
            HostelDesk
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.05] xl:text-6xl">Every hostel repair, from report to fixed.</h1>
          <p className="mt-4 max-w-md text-lg text-slate-600">
            Students report problems, the warden assigns the right technician, and everyone follows the same complaint until it's done.
          </p>
          <div className="mt-8">
            <Journey />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.05 }} className="glass-strong w-full p-7 sm:p-9">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <h2 className="text-3xl font-extrabold">Sign in</h2>
          <p className="mt-1 text-slate-500">Use your hostel account.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="Email">
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@student.edu" />
            </Field>
            <Field label="Password">
              <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </Field>
            {error && <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{error}</p>}
            <Button type="submit" size="lg" loading={busy} icon={<LogIn className="h-4 w-4" />} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-7 rounded-3xl bg-indigo-50/70 p-4">
            <div className="text-sm font-semibold text-ink">Try a demo account</div>
            <p className="mb-3 text-xs text-slate-500">Available after running the seed script. Password: {DEMO_PASSWORD}</p>
            <div className="flex flex-wrap gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(DEMO_PASSWORD); setError(''); }}
                  className="soft-btn rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New student?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Create an account</Link>
          </p>
        </motion.section>
      </div>
    </div>
  );
}
