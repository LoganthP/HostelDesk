import { useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { Segmented, spring } from '../../components/ui';
import { CATEGORY_MAP } from '../../lib/constants';
import { ROLE_SHOWCASES, type RoleTabKey } from './data';

const ROLE_OPTIONS: { value: RoleTabKey; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'warden', label: 'Warden' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function RolesSection() {
  const [role, setRole] = useState<RoleTabKey>('student');
  const reducedMotion = useReducedMotion();
  const active = ROLE_SHOWCASES[role];

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = ROLE_OPTIONS.findIndex((o) => o.value === role);
    let nextIdx = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % ROLE_OPTIONS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + ROLE_OPTIONS.length) % ROLE_OPTIONS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = ROLE_OPTIONS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextRole = ROLE_OPTIONS[nextIdx].value;
    setRole(nextRole);
    const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[nextIdx]?.focus();
  }

  return (
    <section id="roles" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Built for three roles</h2>
            <p className="mt-2.5 text-base text-slate-600">
              Each account opens its own focused workspace with permissions scoped to what that person does.
            </p>
          </div>
          <div onKeyDown={handleKeyDown}>
            <Segmented<RoleTabKey> options={ROLE_OPTIONS} value={role} onChange={setRole} />
          </div>
        </div>

        <div className="mt-6" role="tabpanel" aria-label={`${active.label} workspace`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={role}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.14 } }}
              transition={spring}
              className="grid gap-4 lg:grid-cols-12"
            >
              <motion.div
                whileHover={reducedMotion ? undefined : { y: -4 }}
                transition={spring}
                className="glass glass-hover flex flex-col justify-between p-6 lg:col-span-5"
              >
                <div>
                  <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                    {active.label} view
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold leading-snug text-ink">{active.headline}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{active.summary}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {active.metrics.map((m) => (
                    <div key={m.label} className="rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-white">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                        <span className="font-display text-lg font-extrabold text-indigo-700">{m.value}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">{m.note}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1">
                {active.highlights.map((item) => {
                  const cat = CATEGORY_MAP[item.category ?? 'other'];
                  const Icon = cat.icon;
                  return (
                    <motion.div
                      key={item.title}
                      whileHover={reducedMotion ? undefined : { y: -4 }}
                      transition={spring}
                      className="glass glass-hover flex items-start gap-4 p-5"
                    >
                      <motion.div
                        whileHover={reducedMotion ? undefined : { rotate: [-4, 4, 0] }}
                        transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                        className={clsx('clay-tile grid h-11 w-11 shrink-0 place-items-center rounded-2xl', cat.tile)}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <h3 className="font-display text-lg font-extrabold text-ink">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

