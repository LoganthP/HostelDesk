import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, GraduationCap, Shield, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { spring } from '../../components/ui';
import { DEMO_ACCOUNTS } from './data';

function roleIcon(label: string) {
  if (label === 'Student') return GraduationCap;
  if (label === 'Warden') return Shield;
  return Wrench;
}

export default function DemoAccountsSection() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <section id="demo" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 tabIndex={-1} className="text-3xl font-extrabold outline-none sm:text-4xl">
            Try it now
          </h2>
          <p className="mt-2.5 text-base text-slate-600">
            Pick any seeded role to jump to Sign in with that account prefilled. All demo accounts share the same seeded demo password.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_ACCOUNTS.map((account, idx) => {
            const Icon = roleIcon(account.label);
            return (
              <motion.button
                key={account.email}
                type="button"
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...spring, delay: reducedMotion ? 0 : idx * 0.04 }}
                whileHover={reducedMotion ? undefined : { y: -4 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => navigate('/login', { state: { demoEmail: account.email } })}
                className="glass glass-hover group flex items-start justify-between gap-3 p-5 text-left"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <div className={clsx('clay-tile grid h-11 w-11 shrink-0 place-items-center rounded-2xl', account.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-extrabold text-ink">{account.label}</div>
                    <div className="truncate text-xs font-semibold text-indigo-700">{account.email}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{account.roleSummary}</p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-700" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

