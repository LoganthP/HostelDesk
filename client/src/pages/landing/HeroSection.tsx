import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { Button, PriorityBadge, StatusBadge, spring } from '../../components/ui';
import { CATEGORY_MAP, STATUS_FLOW, STATUS_META } from '../../lib/constants';
import { HERO_JOURNEY } from './data';
import { scrollToSection } from './scroll';

function LiveComplaintCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { amount: 0.25 });
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(() => (reducedMotion ? 3 : 0));
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (reducedMotion || !inView || !tabVisible) return;
    const id = window.setInterval(() => {
      setStep((prev) => (prev + 1) % HERO_JOURNEY.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [reducedMotion, inView, tabVisible]);

  const activeStep = HERO_JOURNEY[step];
  const plumbing = CATEGORY_MAP.plumbing;
  const Icon = plumbing.icon;
  const closed = activeStep.status === 'closed';
  const progressFraction = closed ? 1 : step / (STATUS_FLOW.length - 1);

  return (
    <motion.div
      ref={cardRef}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: reducedMotion ? 0 : 0.18 }}
      whileHover={reducedMotion ? undefined : { y: -4 }}
      className="glass-strong glass-hover p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className={clsx('clay-tile grid h-12 w-12 shrink-0 place-items-center rounded-2xl', plumbing.tile)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-extrabold text-ink">Leaking tap, Room A101</div>
            <div className="text-xs font-medium text-slate-600">Block A · 1st floor · Washbasin tap</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority="high" />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.status}
              initial={reducedMotion ? false : { opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.95 }}
              transition={spring}
            >
              <StatusBadge status={activeStep.status} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-6 pt-1">
        <div className="absolute left-4 right-4 top-5 h-1 rounded-full bg-slate-200/90" aria-hidden>
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={false}
            animate={{ scaleX: progressFraction }}
            transition={spring}
          />
        </div>
        <ol className="relative grid grid-cols-5 gap-1">
          {STATUS_FLOW.map((s, idx) => {
            const done = idx < step || closed;
            const current = idx === step && !closed;
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center">
                <motion.span
                  animate={reducedMotion ? undefined : { scale: done || current ? 1 : 0.9 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className={clsx(
                    'grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors',
                    done && 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30',
                    current && 'bg-white text-indigo-600 ring-4 ring-indigo-200',
                    !done && !current && 'bg-slate-100 text-slate-600',
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : idx + 1}
                </motion.span>
                <span className={clsx('text-[11px] font-semibold leading-tight', done || current ? 'text-ink' : 'text-slate-600')}>
                  {STATUS_META[s].label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 rounded-2xl bg-white/75 px-4 py-3.5 ring-1 ring-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reducedMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm font-bold text-ink">{activeStep.actor}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-600">{activeStep.action}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <section id="top" className="px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0 }}
            className="text-4xl font-extrabold leading-[1.06] sm:text-5xl xl:text-[3.5rem]"
          >
            Every hostel repair, from report to fixed.
          </motion.h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reducedMotion ? 0 : 0.06 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            Students report an issue in their room or shared area, the warden assigns the right specialist, and everyone follows the complaint until the student confirms the repair.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reducedMotion ? 0 : 0.12 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Create a student account
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              Sign in
            </Button>
            <a
              href="#demo"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('demo', true);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-white/70"
            >
              Try the demo
              <ArrowDown className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <LiveComplaintCard />
      </div>
    </section>
  );
}
