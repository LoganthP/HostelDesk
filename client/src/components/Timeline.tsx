import clsx from 'clsx';
import { Check } from 'lucide-react';
import { ACTION_LABEL, ROLE_LABEL, STATUS_FLOW, STATUS_META } from '../lib/constants';
import type { ComplaintStatus, HistoryEntry } from '../lib/types';
import { formatDate } from '../lib/format';

/** Horizontal progress rail: where the complaint is on the happy path. */
export function StatusRail({ status }: { status: ComplaintStatus }) {
  const reopened = status === 'reopened';
  const current = reopened ? 0 : STATUS_FLOW.indexOf(status);
  return (
    <div>
      <ol className="flex items-center">
        {STATUS_FLOW.map((s, i) => {
          const done = i < current || status === 'closed';
          const active = i === current && status !== 'closed';
          return (
            <li key={s} className={clsx('flex items-center', i < STATUS_FLOW.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={clsx(
                    'grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all',
                    done && 'bg-indigo-500 text-white',
                    active && (reopened ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-white text-indigo-600 ring-4 ring-indigo-200'),
                    !done && !active && 'bg-slate-100 text-slate-400',
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={clsx('hidden text-[11px] font-semibold sm:block', done || active ? 'text-ink' : 'text-slate-400')}>
                  {reopened && i === 0 ? 'Reopened' : STATUS_META[s].label}
                </span>
              </div>
              {i < STATUS_FLOW.length - 1 && <span className={clsx('mx-1 mb-0 h-1 flex-1 rounded-full sm:mb-5', i < current || status === 'closed' ? 'bg-indigo-400' : 'bg-slate-200')} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function HistoryList({ history }: { history: HistoryEntry[] }) {
  const items = [...history].reverse();
  return (
    <ol className="relative space-y-5 border-l-2 border-dashed border-indigo-100 pl-6">
      {items.map((h, i) => (
        <li key={`${h.at}-${i}`} className="relative">
          <span className={clsx('absolute -left-[31px] top-1 h-4 w-4 rounded-full ring-4 ring-white', STATUS_META[h.to].dot)} />
          <div className="text-sm font-bold text-ink">{ACTION_LABEL[h.action] ?? h.action}</div>
          <div className="text-xs text-slate-500">
            {h.byName ?? 'System'}
            {h.byRole && <span className="text-slate-400"> ({ROLE_LABEL[h.byRole]})</span>}, {formatDate(h.at)}
          </div>
          {h.note && <p className="mt-1.5 rounded-2xl bg-white/70 px-3 py-2 text-sm text-slate-600 ring-1 ring-white">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
