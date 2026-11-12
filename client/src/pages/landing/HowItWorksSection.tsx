import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ClipboardList, History, UserCheck, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { spring } from '../../components/ui';
import { PROCESS_STEPS } from './data';

const STEP_ICONS = [ClipboardList, UserCheck, Wrench, CheckCircle2, History];

export default function HowItWorksSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">From complaint to confirmation in five clear steps</h2>
          <p className="mt-3 text-base text-slate-600">
            Every ticket moves along one shared status flow, so nobody guesses whether a job was seen or fixed.
          </p>
        </div>

        <div className="relative mt-10">
          {/* Desktop horizontal connecting rail */}
          <div className="pointer-events-none absolute left-10 right-10 top-11 hidden h-1 overflow-hidden rounded-full bg-indigo-100 lg:block" aria-hidden>
            <motion.div
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500"
              initial={reducedMotion ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ ...spring, duration: 0.7 }}
            />
          </div>

          {/* Mobile vertical connecting rail */}
          <div className="pointer-events-none absolute bottom-10 left-9 top-10 w-0.5 border-l-2 border-dashed border-indigo-200 lg:hidden" aria-hidden />

          <ol className="grid gap-4 lg:grid-cols-5">
            {PROCESS_STEPS.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <motion.li
                  key={step.title}
                  initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ ...spring, delay: reducedMotion ? 0 : index * 0.06 }}
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                  className="glass glass-hover relative flex gap-4 p-5 lg:flex-col lg:justify-between"
                >
                  <div className="flex items-start gap-3.5 lg:flex-col lg:gap-4">
                    <motion.div
                      whileHover={reducedMotion ? undefined : { rotate: [-4, 4, 0], scale: 1.04 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                      className={clsx('clay-tile relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl', step.tone)}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <div className="text-xs font-semibold text-indigo-700">{step.caption}</div>
                      <h3 className="mt-1 font-display text-lg font-extrabold text-ink">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

