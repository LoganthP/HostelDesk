import {
  Armchair, Bug, CircleHelp, Droplets, Hammer, Sparkles, Wifi, Zap, type LucideIcon,
} from 'lucide-react';
import type { Category, ComplaintStatus, Priority, Role } from './types';

export interface CategoryMeta {
  value: Category;
  label: string;
  icon: LucideIcon;
  tile: string; // icon tile classes
  chart: string; // hex for charts
  details: { key: string; label: string; placeholder: string }[];
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'plumbing', label: 'Plumbing', icon: Droplets, tile: 'bg-sky-100 text-sky-600', chart: '#38BDF8',
    details: [{ key: 'fixture', label: 'Which fixture?', placeholder: 'Tap, flush, shower, pipe…' }] },
  { value: 'electrical', label: 'Electrical', icon: Zap, tile: 'bg-amber-100 text-amber-600', chart: '#F59E0B',
    details: [{ key: 'appliance', label: 'Appliance or point', placeholder: 'Fan, tube light, socket…' }] },
  { value: 'wifi', label: 'Wi-Fi', icon: Wifi, tile: 'bg-violet-100 text-violet-600', chart: '#8B5CF6',
    details: [
      { key: 'network', label: 'Network name', placeholder: 'e.g. HOSTEL-A' },
      { key: 'accessPoint', label: 'Nearest access point', placeholder: 'e.g. 2nd floor corridor' },
    ] },
  { value: 'carpentry', label: 'Carpentry', icon: Hammer, tile: 'bg-orange-100 text-orange-600', chart: '#FB923C',
    details: [{ key: 'item', label: 'Item', placeholder: 'Door, window, cupboard…' }] },
  { value: 'furniture', label: 'Furniture', icon: Armchair, tile: 'bg-rose-100 text-rose-600', chart: '#F43F5E',
    details: [{ key: 'item', label: 'Item', placeholder: 'Bed, chair, table…' }] },
  { value: 'cleaning', label: 'Cleaning', icon: Sparkles, tile: 'bg-emerald-100 text-emerald-600', chart: '#10B981', details: [] },
  { value: 'pest_control', label: 'Pest control', icon: Bug, tile: 'bg-lime-100 text-lime-700', chart: '#84CC16',
    details: [{ key: 'pest', label: 'What did you see?', placeholder: 'Cockroaches, mosquitoes, rats…' }] },
  { value: 'other', label: 'Other', icon: CircleHelp, tile: 'bg-slate-100 text-slate-600', chart: '#94A3B8', details: [] },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c])) as Record<Category, CategoryMeta>;

export const DETAIL_LABELS: Record<string, string> = {
  fixture: 'Fixture', appliance: 'Appliance', network: 'Network', accessPoint: 'Access point', item: 'Item', pest: 'Pest',
};

export const STATUS_META: Record<ComplaintStatus, { label: string; badge: string; dot: string }> = {
  submitted: { label: 'Submitted', badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  assigned: { label: 'Assigned', badge: 'bg-indigo-100 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  in_progress: { label: 'In progress', badge: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  closed: { label: 'Closed', badge: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-600' },
  reopened: { label: 'Reopened', badge: 'bg-rose-100 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
};

/** The happy path shown as a progress rail on the complaint page. */
export const STATUS_FLOW: ComplaintStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'];

export const PRIORITY_META: Record<Priority, { label: string; badge: string; rank: number }> = {
  urgent: { label: 'Urgent', badge: 'bg-red-500 text-white ring-red-500', rank: 0 },
  high: { label: 'High', badge: 'bg-orange-100 text-orange-700 ring-orange-200', rank: 1 },
  medium: { label: 'Medium', badge: 'bg-violet-100 text-violet-700 ring-violet-200', rank: 2 },
  low: { label: 'Low', badge: 'bg-sky-100 text-sky-700 ring-sky-200', rank: 3 },
};
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export const ROLE_LABEL: Record<Role, string> = { student: 'Student', warden: 'Warden', maintenance: 'Maintenance' };

export const SPECIALIZATIONS = [
  { value: 'general', label: 'General' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'wifi', label: 'IT support / Wi-Fi' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'pest_control', label: 'Pest control' },
];
export const specLabel = (v?: string) => SPECIALIZATIONS.find((s) => s.value === v)?.label ?? 'General';

export const ACTION_LABEL: Record<string, string> = {
  submitted: 'Complaint submitted',
  assigned: 'Technician assigned',
  reassigned: 'Technician reassigned',
  priority_changed: 'Priority updated',
  started: 'Work started',
  resolved: 'Marked as resolved',
  confirmed: 'Repair confirmed',
  reopened: 'Reopened',
  closed: 'Closed by warden',
};

export const SHARED_AREAS = ['Corridor', 'Common bathroom', 'Washroom', 'Study hall', 'Mess', 'Laundry room', 'Staircase', 'Terrace'];
