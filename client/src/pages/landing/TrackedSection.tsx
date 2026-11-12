import { motion, useReducedMotion } from 'framer-motion';
import { History, RotateCcw, Wifi } from 'lucide-react';
import clsx from 'clsx';
import { Card, StatusBadge, spring } from '../../components/ui';
import { CATEGORY_MAP, STATUS_META } from '../../lib/constants';
import { TRACKED_BARS, TRACKED_TIMELINE } from './data';

export default function TrackedSection() {
  const reducedMotion = useReducedMotion();
  const wifi = CATEGORY_MAP.wifi;
  const WifiIcon = wifi.icon;

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Everything is tracked</h2>
          <p className="mt-2.5 text-base text-slate-600">
            Audit trails, technician specialties, reports, reopenings, and past room allocations stay connected without manual spreadsheets.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-12">
          {/* 1. Complaint history timeline */}
          <Card
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={spring}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="glass-hover md:col-span-7"
          >
            <h3 className="font-display text-xl font-extrabold text-ink">Complaint history timeline</h3>
            <p className="mt-1 text-sm text-slate-600">
              Every state transition stores who acted, their role, timestamp, and repair note.
            </p>
            <ol className="relative mt-5 space-y-4 border-l-2 border-dashed border-indigo-200 pl-6">
              {TRACKED_TIMELINE.map((entry) => (
                <li key={entry.action} className="relative">
                  <span className={clsx('absolute -left-[31px] top-1 h-4 w-4 rounded-full ring-4 ring-white', STATUS_META[entry.status].dot)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">{entry.action}</span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    {entry.by}, {entry.when}
                  </div>
                  {entry.note && (
                    <p className="mt-1.5 rounded-2xl bg-white/80 px-3 py-2 text-sm text-slate-700 ring-1 ring-white">
                      {entry.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          {/* 2. Specialty matching */}
          <Card
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring, delay: reducedMotion ? 0 : 0.06 }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="glass-hover flex flex-col justify-between md:col-span-5"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className={clsx('clay-tile grid h-11 w-11 place-items-center rounded-2xl', wifi.tile)}>
                  <WifiIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold text-ink">Specialty matching</h3>
                  <p className="text-xs font-medium text-slate-600">Wi-Fi goes to IT support first</p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between rounded-2xl bg-indigo-50/90 px-3.5 py-2.5 ring-1 ring-indigo-100">
                  <div>
                    <div className="text-sm font-bold text-ink">Farhan Ali</div>
                    <div className="text-xs font-medium text-slate-600">IT support / Wi-Fi</div>
                  </div>
                  <span className="rounded-full bg-indigo-500 px-2.5 py-0.5 text-xs font-bold text-white">Preselected · 0 jobs</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/75 px-3.5 py-2.5 ring-1 ring-white">
                  <div>
                    <div className="text-sm font-bold text-ink">Ravi Verma</div>
                    <div className="text-xs font-medium text-slate-600">Plumbing</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">1 open job</span>
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-2xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900 ring-1 ring-amber-100">
              If no active specialist matches a category, the warden sees an alert before assigning.
            </p>
          </Card>

          {/* 3. Reports bar chart */}
          <Card
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring, delay: reducedMotion ? 0 : 0.1 }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="glass-hover md:col-span-6"
          >
            <h3 className="font-display text-xl font-extrabold text-ink">Reports by category &amp; block</h3>
            <p className="mt-1 text-sm text-slate-600">
              See which blocks generate recurring faults and how fast each trade resolves tickets.
            </p>
            <div className="mt-5 space-y-3">
              {TRACKED_BARS.map((bar, idx) => (
                <div key={bar.label} className="grid grid-cols-[84px_1fr_32px] items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-700">{bar.label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-white">
                    <motion.div
                      className="h-full origin-left rounded-full"
                      style={{ backgroundColor: bar.color }}
                      initial={reducedMotion ? { scaleX: bar.count / bar.max } : { scaleX: 0 }}
                      whileInView={{ scaleX: bar.count / bar.max }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ ...spring, delay: reducedMotion ? 0 : idx * 0.06 }}
                    />
                  </div>
                  <span className="text-right font-bold text-ink">{bar.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Reopening */}
          <Card
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring, delay: reducedMotion ? 0 : 0.14 }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="glass-hover flex flex-col justify-between md:col-span-3"
          >
            <div>
              <div className="clay-tile grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-extrabold text-ink">Reopen if it returns</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                When a student reopens with “What’s still wrong?”, the ticket returns straight to Needs assignment.
              </p>
            </div>
            <div className="mt-4">
              <StatusBadge status="reopened" />
            </div>
          </Card>

          {/* 5. Room history */}
          <Card
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...spring, delay: reducedMotion ? 0 : 0.18 }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="glass-hover flex flex-col justify-between md:col-span-3"
          >
            <div>
              <div className="clay-tile grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
                <History className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-extrabold text-ink">Room history stays accurate</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Moving to Room B101 keeps your past stay on My room—and older complaints keep showing Room A103.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">
              <Wifi className="h-3.5 w-3.5" /> Snapshots per complaint
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
