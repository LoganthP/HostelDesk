import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BedDouble, Building, Send } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { api, errorMessage } from '../../lib/api';
import { CATEGORIES, CATEGORY_MAP, SHARED_AREAS } from '../../lib/constants';
import type { Allocation, Category, Complaint } from '../../lib/types';
import { floorName } from '../../lib/format';
import { Button, Card, Field, Input, PageHeader, PageLoader, Select, Textarea } from '../../components/ui';

export default function NewComplaint() {
  const navigate = useNavigate();
  const toast = useToast();
  const mine = useFetch<{ current: Allocation | null }>('/allocations/me');
  const blocksRes = useFetch<{ blocks: string[] }>('/rooms/blocks');
  const current = mine.data?.current ?? null;
  const blocks = blocksRes.data?.blocks ?? [];

  const [category, setCategory] = useState<Category | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<'room' | 'shared'>('room');
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const prefilled = useRef(false);

  // No room yet → only shared areas make sense. Prefill the student's own block for shared areas.
  useEffect(() => {
    if (mine.data && !mine.data.current) setLocationType('shared');
  }, [mine.data]);
  useEffect(() => {
    if (prefilled.current || !mine.data) return;
    if (current) {
      setBlock(current.roomId.block);
      setFloor(String(current.roomId.floor));
      prefilled.current = true;
    } else if (blocks.length) {
      setBlock(blocks[0]);
      prefilled.current = true;
    }
  }, [mine.data, current, blocks]);

  if (mine.loading && !mine.data) return <PageLoader />;

  const fields = category ? CATEGORY_MAP[category].details : [];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!category) return setError('Choose what kind of problem this is.');
    if (title.trim().length < 3) return setError('Add a short title (at least 3 characters).');
    if (description.trim().length < 5) return setError('Describe the problem (at least 5 characters).');
    if (locationType === 'shared' && (!block || !area.trim())) return setError('Choose the block and describe the shared area.');
    setBusy(true);
    try {
      const keep = Object.fromEntries(fields.map((f) => [f.key, details[f.key] ?? '']));
      const { complaint } = await api.post<{ complaint: Complaint }>('/complaints', {
        category, title, description, locationType, block, floor, area, details: keep,
      });
      toast.success('Complaint submitted. The warden has been notified.');
      navigate(`/complaints/${complaint._id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Report an issue" subtitle="Tell us what's wrong and where. You can follow the repair from your complaints page." />
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 text-lg font-bold">What kind of problem is it?</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <motion.button
                    key={c.value}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    onClick={() => setCategory(c.value)}
                    aria-pressed={active}
                    className={clsx(
                      'clay-tile flex flex-col items-center gap-2 rounded-3xl px-3 py-4 text-sm font-bold transition-colors',
                      active ? 'bg-ink text-white' : 'bg-white/80 text-slate-700',
                    )}
                  >
                    <span className={clsx('grid h-11 w-11 place-items-center rounded-2xl', active ? 'bg-white/15 text-white' : c.tile)}>
                      <c.icon className="h-5 w-5" />
                    </span>
                    {c.label}
                  </motion.button>
                );
              })}
            </div>
          </Card>

          <Card delay={0.05} className="space-y-4">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Bathroom tap is leaking" />
            </Field>
            <Field label="Describe the problem" hint="When did it start? How bad is it? Anything the technician should know?">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="The tap drips all night and the floor stays wet…" />
            </Field>
            {fields.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <Input value={details[f.key] ?? ''} onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  </Field>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card delay={0.1} className="space-y-4">
            <h2 className="text-lg font-bold">Where is it?</h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: 'room', label: 'My room', icon: BedDouble, disabled: !current },
                { v: 'shared', label: 'Shared area', icon: Building, disabled: false },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  disabled={o.disabled}
                  onClick={() => setLocationType(o.v)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-sm font-bold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40',
                    locationType === o.v ? 'bg-indigo-500 text-white ring-indigo-500' : 'bg-white/70 text-slate-600 ring-white hover:text-ink',
                  )}
                >
                  <o.icon className="h-5 w-5" />
                  {o.label}
                </button>
              ))}
            </div>

            {locationType === 'room' && current && (
              <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
                <div className="text-xs font-semibold text-indigo-600">Filled in from your allocation</div>
                <div className="font-display text-2xl font-extrabold text-ink">Room {current.roomId.roomNumber}</div>
                <div className="text-sm text-slate-600">Block {current.roomId.block}, {floorName(current.roomId.floor)}, bed {current.bedLabel}</div>
              </div>
            )}
            {locationType === 'room' && !current && (
              <p className="text-sm text-slate-500">You don't have a room yet, so choose a shared area.</p>
            )}

            {locationType === 'shared' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Block">
                    <Select value={block} onChange={(e) => setBlock(e.target.value)}>
                      {blocks.length === 0 && <option value="">No blocks yet</option>}
                      {blocks.map((b) => <option key={b} value={b}>Block {b}</option>)}
                    </Select>
                  </Field>
                  <Field label="Floor">
                    <Input type="number" min={0} value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Optional" />
                  </Field>
                </div>
                <Field label="Area">
                  <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 2nd floor corridor" maxLength={120} />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  {SHARED_AREAS.map((a) => (
                    <button key={a} type="button" onClick={() => setArea(a)}
                      className={clsx('rounded-full px-3 py-1 text-xs font-semibold ring-1 transition', area === a ? 'bg-ink text-white ring-ink' : 'bg-white/70 text-slate-600 ring-white hover:text-ink')}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{error}</p>}
          <Button type="submit" size="lg" loading={busy} icon={<Send className="h-4 w-4" />} className="w-full">
            Submit complaint
          </Button>
        </div>
      </form>
    </>
  );
}
