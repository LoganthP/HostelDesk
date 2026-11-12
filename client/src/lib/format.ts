import type { ComplaintLocation } from './types';

export const complaintCode = (id: string) => `#${id.slice(-6).toUpperCase()}`;

export function formatDate(value?: string | null, withTime = true) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function timeAgo(value?: string | null) {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
    [604800, 'week'],
    [2629800, 'month'],
  ];
  let unit = units[0];
  for (const u of units) if (diff >= u[0]) unit = u;
  const n = Math.floor(diff / unit[0]);
  return `${n} ${unit[1]}${n === 1 ? '' : 's'} ago`;
}

export function locationText(loc: ComplaintLocation) {
  if (loc.kind === 'room') return `Room ${loc.roomNumber}, Block ${loc.block}${loc.bedLabel ? `, bed ${loc.bedLabel}` : ''}`;
  const floor = loc.floor !== undefined && loc.floor !== null ? `, floor ${loc.floor}` : '';
  return `${loc.area}, Block ${loc.block}${floor}`;
}

export function hours(h: number) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

export const floorName = (f: number) => (f === 0 ? 'Ground floor' : `Floor ${f}`);

export const firstName = (name?: string) => (name || '').split(' ')[0];
