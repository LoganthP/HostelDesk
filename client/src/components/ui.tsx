import {
  useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { AlertTriangle, Loader2, RefreshCw, X, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { ComplaintStatus, Priority } from '../lib/types';
import { PRIORITY_META, STATUS_META } from '../lib/constants';

export const spring = { type: 'spring', stiffness: 260, damping: 24 } as const;

/* ---------- Surfaces ---------- */

export function Card({ className, children, delay = 0, ...rest }: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      className={clsx('glass p-5 sm:p-6', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Buttons & inputs ---------- */

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
const VARIANTS: Record<Variant, string> = {
  primary: 'clay-btn bg-gradient-to-br from-indigo-500 to-violet-500 text-white',
  secondary: 'soft-btn text-slate-700',
  danger: 'clay-btn bg-gradient-to-br from-rose-500 to-pink-500 text-white',
  success: 'clay-btn bg-gradient-to-br from-emerald-500 to-teal-500 text-white',
  warning: 'clay-btn bg-gradient-to-br from-amber-400 to-orange-500 text-white',
  ghost: 'text-slate-600 hover:bg-white/70',
};
const SIZES = { sm: 'h-9 px-3.5 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-base' };

/** Same look as <Button>, for <Link> elements. */
export const buttonClass = (variant: Variant = 'primary', size: keyof typeof SIZES = 'md', className?: string) =>
  clsx('inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all duration-200', SIZES[size], VARIANTS[variant], className);

export function Button({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZES; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={clsx('neu-input', className)} {...p} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={clsx('neu-input cursor-pointer pr-9', className)} {...p} />
);
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={clsx('neu-input min-h-[96px] resize-y leading-relaxed', className)} {...p} />
);

/** Pill toggle used for tabs and filters. */
export function Segmented<T extends string>({ options, value, onChange, className }: {
  options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div className={clsx('inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white/50 p-1 ring-1 ring-white', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={clsx('relative whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors', active ? 'text-white' : 'text-slate-600 hover:text-ink')}
          >
            {active && (
              <motion.span layoutId={`seg-${options.map((x) => x.value).join('')}`} className="absolute inset-0 rounded-xl bg-ink shadow" transition={spring} />
            )}
            <span className="relative flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && (
                <span className={clsx('rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-slate-200/70')}>{o.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Badges ---------- */

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', m.badge)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1', m.badge)}>{m.label}</span>;
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className ?? 'bg-slate-100 text-slate-600')}>{children}</span>;
}

/* ---------- Feedback ---------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-6 w-6 animate-spin text-indigo-500', className)} />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-8 w-8" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-500 clay-tile">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="max-w-md font-medium text-slate-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <div className="clay-tile grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
      {action}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({ open, onClose, title, subtitle, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={clsx('glass-strong relative flex max-h-[92vh] w-full flex-col', wide ? 'max-w-2xl' : 'max-w-lg')}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
              </div>
              <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small numeric tile for bento grids. */
export function Metric({ label, value, icon: Icon, tone, delay = 0, hint, className }: {
  label: string; value: ReactNode; icon: LucideIcon; tone: string; delay?: number; hint?: ReactNode; className?: string;
}) {
  return (
    <Card delay={delay} className={clsx('flex flex-col justify-between gap-4', className)}>
      <div className={clsx('clay-tile grid h-11 w-11 place-items-center rounded-2xl', tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-4xl font-extrabold leading-none text-ink">{value}</div>
        <div className="mt-1.5 text-sm font-semibold text-slate-600">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
      </div>
    </Card>
  );
}
