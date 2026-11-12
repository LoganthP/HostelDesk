import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Building2, History, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { api, errorMessage } from '../../lib/api';
import type { AvailableBed, Bed, Room, UserLite } from '../../lib/types';
import { floorName, formatDate } from '../../lib/format';
import { AllocateModal, CheckoutModal, HistoryModal, TransferModal } from '../../components/AllocationModals';
import { Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, PageLoader, Segmented } from '../../components/ui';

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; room: Room }
  | { kind: 'delete'; room: Room }
  | { kind: 'allocate'; bed: AvailableBed }
  | { kind: 'occupant'; room: Room; bed: Bed }
  | { kind: 'transfer' | 'checkout' | 'history'; student: UserLite; label: string }
  | null;

function RoomForm({ room, onClose, onSaved }: { room?: Room; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [block, setBlock] = useState(room?.block ?? '');
  const [floor, setFloor] = useState(room ? String(room.floor) : '1');
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber ?? '');
  const [beds, setBeds] = useState(room ? room.beds.map((b) => b.label).join(', ') : '');
  const [bedCount, setBedCount] = useState('2');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const labels = beds.split(',').map((s) => s.trim()).filter(Boolean);
      if (room) await api.patch(`/rooms/${room._id}`, { block, floor, roomNumber, beds: labels });
      else await api.post('/rooms', { block, floor, roomNumber, ...(labels.length ? { beds: labels } : { bedCount: Number(bedCount) }) });
      toast.success(room ? 'Room updated.' : `Room ${roomNumber.toUpperCase()} added.`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={room ? `Edit room ${room.roomNumber}` : 'Add a room'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save} disabled={!block.trim() || !roomNumber.trim()}>{room ? 'Save changes' : 'Add room'}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Block"><Input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="A" /></Field>
        <Field label="Floor" hint="0 = ground"><Input type="number" min={0} value={floor} onChange={(e) => setFloor(e.target.value)} /></Field>
        <Field label="Room number"><Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="A101" /></Field>
        {!room && (
          <Field label="Number of beds" className="sm:col-span-1" hint="Labelled A, B, C…">
            <Input type="number" min={1} max={12} value={bedCount} onChange={(e) => setBedCount(e.target.value)} disabled={!!beds.trim()} />
          </Field>
        )}
        <Field label={room ? 'Bed labels' : 'Or custom bed labels'} className={room ? 'sm:col-span-3' : 'sm:col-span-2'} hint="Comma separated, e.g. A, B, C. Occupied beds can't be removed.">
          <Input value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="Optional" />
        </Field>
      </div>
    </Modal>
  );
}

/** The bed "keys" — free beds are open slots, taken beds show who sleeps there. */
function BedKey({ bed, onClick }: { bed: Bed; onClick: () => void }) {
  const taken = !!bed.occupant;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      title={taken ? `${bed.occupant!.student.name}, since ${formatDate(bed.occupant!.startDate, false)}` : 'Free bed. Click to allocate'}
      className={clsx(
        'flex min-w-0 items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-xs font-bold',
        taken ? 'clay-tile bg-gradient-to-br from-indigo-500 to-violet-500 text-white' : 'border-2 border-dashed border-emerald-300 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100',
      )}
    >
      <span className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-xl', taken ? 'bg-white/20' : 'bg-white text-emerald-600')}>{bed.label}</span>
      <span className="truncate">{taken ? bed.occupant!.student.name.split(' ')[0] : 'Free'}</span>
    </motion.button>
  );
}

export default function RoomsPage() {
  const { data, loading, error, reload } = useFetch<{ rooms: Room[] }>('/rooms');
  const toast = useToast();
  const [block, setBlock] = useState('all');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const close = () => setDialog(null);

  const rooms = useMemo(() => data?.rooms ?? [], [data]);
  const blocks = useMemo(() => [...new Set(rooms.map((r) => r.block))], [rooms]);
  const activeBlock = block === 'all' || blocks.includes(block) ? block : 'all';
  const visible = activeBlock === 'all' ? rooms : rooms.filter((r) => r.block === activeBlock);
  const totals = useMemo(() => {
    const beds = visible.reduce((n, r) => n + r.beds.length, 0);
    const taken = visible.reduce((n, r) => n + r.occupiedCount, 0);
    return { beds, taken, free: beds - taken };
  }, [visible]);
  const byFloor = useMemo(() => {
    const map = new Map<string, Room[]>();
    visible.forEach((r) => {
      const key = `${r.block}|${r.floor}`;
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return [...map.entries()];
  }, [visible]);

  async function deleteRoom(room: Room) {
    setBusy(true);
    try {
      await api.del(`/rooms/${room._id}`);
      toast.success(`Room ${room.roomNumber} deleted.`);
      reload();
      close();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;

  const occ = dialog?.kind === 'occupant' ? dialog : null;
  const occLabel = occ ? `Room ${occ.room.roomNumber}, bed ${occ.bed.label}` : '';

  return (
    <>
      <PageHeader
        title="Rooms & beds"
        subtitle="Click a free bed to allocate it, or an occupied bed to transfer or check out the student."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setDialog({ kind: 'add' })}>Add room</Button>}
      />

      {rooms.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No rooms yet" text="Add your hostel's rooms and beds to start allocating students." action={<Button onClick={() => setDialog({ kind: 'add' })}>Add the first room</Button>} /></Card>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Segmented value={activeBlock} onChange={setBlock} options={[{ value: 'all', label: 'All blocks' }, ...blocks.map((b) => ({ value: b, label: `Block ${b}` }))]} />
            <div className="flex gap-2 text-sm">
              <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-600 ring-1 ring-white">{totals.beds} beds</span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">{totals.taken} occupied</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">{totals.free} free</span>
            </div>
          </div>

          <div className="space-y-6">
            {byFloor.map(([key, list]) => {
              const [b, f] = key.split('|');
              return (
                <section key={key}>
                  <h2 className="mb-3 text-lg font-bold">Block {b}, {floorName(Number(f))}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((room, i) => (
                      <Card key={room._id} delay={Math.min(i, 8) * 0.03} className="p-4 sm:p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="font-display text-2xl font-extrabold text-ink">{room.roomNumber}</div>
                            <div className="text-xs font-semibold text-slate-500">{room.occupiedCount} of {room.beds.length} beds taken</div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setDialog({ kind: 'edit', room })} className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-ink" aria-label={`Edit room ${room.roomNumber}`}><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setDialog({ kind: 'delete', room })} className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete room ${room.roomNumber}`}><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" style={{ width: `${(room.occupiedCount / room.beds.length) * 100}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {room.beds.map((bed) => (
                            <BedKey
                              key={bed.label}
                              bed={bed}
                              onClick={() =>
                                bed.occupant
                                  ? setDialog({ kind: 'occupant', room, bed })
                                  : setDialog({ kind: 'allocate', bed: { roomId: room._id, block: room.block, floor: room.floor, roomNumber: room.roomNumber, bedLabel: bed.label } })
                              }
                            />
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {(dialog?.kind === 'add' || dialog?.kind === 'edit') && <RoomForm room={dialog.kind === 'edit' ? dialog.room : undefined} onClose={close} onSaved={reload} />}

      <Modal
        open={dialog?.kind === 'delete'}
        onClose={close}
        title={`Delete room ${dialog?.kind === 'delete' ? dialog.room.roomNumber : ''}?`}
        subtitle="Only empty rooms that have never been allocated can be deleted, so allocation history stays intact."
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button variant="danger" loading={busy} onClick={() => dialog?.kind === 'delete' && deleteRoom(dialog.room)}>Delete room</Button></>}
      >
        <p className="text-sm text-slate-600">This can't be undone.</p>
      </Modal>

      <AllocateModal open={dialog?.kind === 'allocate'} onClose={close} onDone={reload} bed={dialog?.kind === 'allocate' ? dialog.bed : null} />

      <Modal open={!!occ} onClose={close} title={occ?.bed.occupant?.student.name ?? ''} subtitle={occLabel}>
        {occ?.bed.occupant && (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-2xl bg-indigo-50 p-4 text-sm ring-1 ring-indigo-100 sm:grid-cols-2">
              <div><div className="text-xs font-semibold text-slate-500">Email</div><div className="font-semibold text-ink">{occ.bed.occupant.student.email}</div></div>
              <div><div className="text-xs font-semibold text-slate-500">Roll number</div><div className="font-semibold text-ink">{occ.bed.occupant.student.rollNumber ?? '—'}</div></div>
              <div><div className="text-xs font-semibold text-slate-500">In this bed since</div><div className="font-semibold text-ink">{formatDate(occ.bed.occupant.startDate, false)}</div></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setDialog({ kind: 'transfer', student: occ.bed.occupant!.student, label: occLabel })}>Transfer</Button>
              <Button variant="secondary" icon={<History className="h-4 w-4" />} onClick={() => setDialog({ kind: 'history', student: occ.bed.occupant!.student, label: occLabel })}>Room history</Button>
              <Button variant="danger" icon={<LogOut className="h-4 w-4" />} onClick={() => setDialog({ kind: 'checkout', student: occ.bed.occupant!.student, label: occLabel })}>Check out</Button>
            </div>
          </div>
        )}
      </Modal>

      <TransferModal open={dialog?.kind === 'transfer'} onClose={close} onDone={reload} student={dialog?.kind === 'transfer' ? dialog.student : null} currentLabel={dialog?.kind === 'transfer' ? dialog.label : undefined} />
      <CheckoutModal open={dialog?.kind === 'checkout'} onClose={close} onDone={reload} student={dialog?.kind === 'checkout' ? dialog.student : null} currentLabel={dialog?.kind === 'checkout' ? dialog.label : undefined} />
      <HistoryModal open={dialog?.kind === 'history'} onClose={close} student={dialog?.kind === 'history' ? dialog.student : null} />
    </>
  );
}
