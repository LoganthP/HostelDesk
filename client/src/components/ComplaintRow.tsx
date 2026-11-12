import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, UserRound, Wrench } from 'lucide-react';
import clsx from 'clsx';
import type { Complaint } from '../lib/types';
import { CATEGORY_MAP } from '../lib/constants';
import { complaintCode, locationText, timeAgo } from '../lib/format';
import { PriorityBadge, StatusBadge } from './ui';

export function ComplaintRow({ c, showStudent, showAssignee, index = 0 }: { c: Complaint; showStudent?: boolean; showAssignee?: boolean; index?: number }) {
  const cat = CATEGORY_MAP[c.category];
  return (
    <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 10) * 0.03 }}>
      <Link to={`/complaints/${c._id}`} className="glass glass-hover flex items-start gap-4 p-4 sm:p-5">
        <div className={clsx('clay-tile grid h-12 w-12 shrink-0 place-items-center rounded-2xl', cat.tile)}>
          <cat.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="truncate font-sans text-base font-bold text-ink">{c.title}</h3>
            <span className="text-xs font-semibold text-slate-400">{complaintCode(c._id)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{locationText(c.location)}</span>
            {showStudent && c.studentId && <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{c.studentId.name}</span>}
            {showAssignee && (
              <span className={clsx('inline-flex items-center gap-1', !c.assignedTo && 'font-semibold text-rose-500')}>
                <Wrench className="h-3.5 w-3.5" />
                {c.assignedTo ? c.assignedTo.name : 'Not assigned'}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            <span className="text-xs text-slate-400">{cat.label}</span>
            <span className="ml-auto text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}
