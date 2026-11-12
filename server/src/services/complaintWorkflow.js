import { STATUS_LABEL } from '../constants.js';
import { conflict, sameId } from '../utils/http.js';

export const POPULATE = [
  { path: 'studentId', select: 'name email rollNumber phone' },
  { path: 'assignedTo', select: 'name email phone specialization' },
];

/** Records who changed the status, when, and why — then applies the change. */
export function transition(complaint, { to, action, user, note }) {
  complaint.statusHistory.push({
    from: complaint.status ?? null,
    to,
    action,
    note: note || undefined,
    by: user._id,
    byName: user.name,
    byRole: user.role,
    at: new Date(),
  });
  complaint.status = to;
}

export function assertStatus(complaint, allowed, verb) {
  if (!allowed.includes(complaint.status)) {
    throw conflict(`You can't ${verb} a complaint that is ${STATUS_LABEL[complaint.status]}.`);
  }
}

export function canView(user, complaint) {
  if (user.role === 'warden') return true;
  if (user.role === 'student') return sameId(complaint.studentId, user._id);
  if (user.role === 'maintenance') return sameId(complaint.assignedTo, user._id);
  return false;
}

/** Keeps category-specific details to a small set of short string fields. */
export function cleanDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  const out = {};
  for (const [key, value] of Object.entries(details).slice(0, 10)) {
    if (!/^[a-zA-Z]\w{0,30}$/.test(key) || typeof value !== 'string') continue;
    const v = value.trim().slice(0, 200);
    if (v) out[key] = v;
  }
  return out;
}

export const joinNotes = (...parts) => parts.filter(Boolean).join('. ') || undefined;
