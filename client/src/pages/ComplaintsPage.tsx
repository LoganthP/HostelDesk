import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDebounced, useFetch } from '../hooks/useFetch';
import { CATEGORIES, PRIORITIES, PRIORITY_META } from '../lib/constants';
import type { Complaint, ComplaintStatus } from '../lib/types';
import { ComplaintRow } from '../components/ComplaintRow';
import { buttonClass, Card, EmptyState, ErrorState, Input, PageHeader, PageLoader, Segmented, Select } from '../components/ui';

type Tab = 'all' | 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
const TAB_STATUSES: Record<Tab, ComplaintStatus[]> = {
  all: [],
  new: ['submitted', 'reopened'],
  assigned: ['assigned'],
  in_progress: ['in_progress'],
  resolved: ['resolved'],
  closed: ['closed'],
};

export default function ComplaintsPage() {
  const { user } = useAuth();
  const role = user!.role;
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [block, setBlock] = useState('');
  const search = useDebounced(q);

  const params = new URLSearchParams();
  if (search.trim()) params.set('q', search.trim());
  if (category) params.set('category', category);
  if (priority) params.set('priority', priority);
  if (block) params.set('block', block);
  const { data, loading, error, reload } = useFetch<{ complaints: Complaint[] }>(`/complaints?${params.toString()}`);
  const { data: blocks } = useFetch<{ blocks: string[] }>(role === 'warden' ? '/rooms/blocks' : null);

  const all = useMemo(() => data?.complaints ?? [], [data]);
  // Counts stay hidden until the first response arrives, so loading never looks like an empty database.
  const counts = useMemo(() => {
    const c = {} as Record<Tab, number | undefined>;
    if (!data) return c;
    (Object.keys(TAB_STATUSES) as Tab[]).forEach((t) => {
      c[t] = t === 'all' ? all.length : all.filter((x) => TAB_STATUSES[t].includes(x.status)).length;
    });
    return c;
  }, [all]);
  const visible = useMemo(() => {
    const list = tab === 'all' ? all : all.filter((x) => TAB_STATUSES[tab].includes(x.status));
    // Technicians and wardens see the most pressing work first.
    if (role !== 'student') return [...list].sort((a, b) => PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank);
    return list;
  }, [all, tab, role]);

  const title = role === 'student' ? 'My complaints' : role === 'maintenance' ? 'My jobs' : 'Complaints';
  const subtitle =
    role === 'student'
      ? 'Follow each issue from the moment you report it until it is fixed.'
      : role === 'maintenance'
        ? 'Jobs assigned to you, most urgent first.'
        : 'Review new issues, set priorities and assign the right technician.';

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          role === 'student' && (
            <Link to="/complaints/new" className={buttonClass()}>
              <Plus className="h-4 w-4" /> Report an issue
            </Link>
          )
        }
      />

      <Card className="mb-5 space-y-4 p-4 sm:p-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'new', label: role === 'warden' ? 'Needs assignment' : role === 'student' ? 'Awaiting assignment' : 'Reopened', count: counts.new },
            { value: 'assigned', label: 'Assigned', count: counts.assigned },
            { value: 'in_progress', label: 'In progress', count: counts.in_progress },
            { value: 'resolved', label: role === 'student' ? 'Awaiting confirmation' : 'Resolved', count: counts.resolved },
            { value: 'closed', label: 'Closed', count: counts.closed },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, room or area" className="pl-10" aria-label="Search complaints" />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
          </Select>
          {role === 'warden' && (
            <Select value={block} onChange={(e) => setBlock(e.target.value)} aria-label="Block">
              <option value="">All blocks</option>
              {blocks?.blocks.map((b) => <option key={b} value={b}>Block {b}</option>)}
            </Select>
          )}
        </div>
      </Card>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <PageLoader />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={all.length === 0 && !search && !category && !priority && !block ? 'Nothing here yet' : 'No complaints match these filters'}
            text={
              role === 'student'
                ? 'When something in your room or a shared area needs fixing, report it and track it here.'
                : role === 'maintenance'
                  ? 'Jobs the warden assigns to you will appear here.'
                  : 'Try a different tab or clear the filters.'
            }
            action={role === 'student' && <Link to="/complaints/new" className={buttonClass()}>Report an issue</Link>}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((c, i) => (
            <ComplaintRow key={c._id} c={c} index={i} showStudent={role !== 'student'} showAssignee={role === 'warden'} />
          ))}
        </ul>
      )}
    </>
  );
}
