import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRightLeft, LogOut, RotateCcw, X } from 'lucide-react';
import clsx from 'clsx';
import { Button, spring } from '../../components/ui';
import { INITIAL_DEMO_ROOMS, SAMPLE_WAITLIST_STUDENTS, type DemoRoom } from './data';

interface SelectedBed {
  roomNumber: string;
  bedLabel: string;
}

function cloneRooms(rooms: DemoRoom[]): DemoRoom[] {
  return rooms.map((r) => ({
    ...r,
    beds: r.beds.map((b) => ({ ...b, occupant: b.occupant ? { ...b.occupant } : null })),
  }));
}

export default function RoomsDemoSection() {
  const [rooms, setRooms] = useState<DemoRoom[]>(() => cloneRooms(INITIAL_DEMO_ROOMS));
  const [waitlistIndex, setWaitlistIndex] = useState(0);
  const [selected, setSelected] = useState<SelectedBed | null>(null);
  const [notice, setNotice] = useState('Click a free bed to allocate a student, or an occupied bed to transfer or check out.');
  const actionCardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const stats = useMemo(() => {
    const total = rooms.reduce((sum, r) => sum + r.beds.length, 0);
    const taken = rooms.reduce((sum, r) => sum + r.beds.filter((b) => b.occupant).length, 0);
    return { total, taken, free: total - taken };
  }, [rooms]);

  const selectedRoom = selected ? rooms.find((r) => r.roomNumber === selected.roomNumber) : undefined;
  const selectedBed = selectedRoom?.beds.find((b) => b.label === selected?.bedLabel);
  const activeOccupant = selectedBed?.occupant ?? null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    const onPointer = (e: PointerEvent) => {
      if (actionCardRef.current && !actionCardRef.current.contains(e.target as Node)) {
        const targetEl = e.target as HTMLElement | null;
        if (!targetEl?.closest('[data-demo-bed="true"]')) {
          setSelected(null);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [selected]);

  function handleAllocate(roomNumber: string, bedLabel: string) {
    setSelected(null);
    const assignedIds = new Set(rooms.flatMap((r) => r.beds.map((b) => b.occupant?.id).filter(Boolean)));
    const candidate = SAMPLE_WAITLIST_STUDENTS.find((_, i) => {
      const s = SAMPLE_WAITLIST_STUDENTS[(waitlistIndex + i) % SAMPLE_WAITLIST_STUDENTS.length];
      return !assignedIds.has(s.id);
    });
    const nextStudent = candidate ?? {
      id: `student-${Date.now()}`,
      name: 'Dev Patel',
      roll: '4VV23CS104',
    };

    setWaitlistIndex((i) => (i + 1) % SAMPLE_WAITLIST_STUDENTS.length);
    setRooms((prev) =>
      prev.map((r) =>
        r.roomNumber === roomNumber
          ? { ...r, beds: r.beds.map((b) => (b.label === bedLabel ? { ...b, occupant: nextStudent } : b)) }
          : r,
      ),
    );
    setNotice(`${nextStudent.name} allocated to Room ${roomNumber}, bed ${bedLabel}.`);
  }

  function handleTransfer() {
    if (!selected || !activeOccupant) return;
    let target: SelectedBed | null = null;
    for (const r of rooms) {
      for (const b of r.beds) {
        if (!b.occupant && (r.roomNumber !== selected.roomNumber || b.label !== selected.bedLabel)) {
          target = { roomNumber: r.roomNumber, bedLabel: b.label };
          break;
        }
      }
      if (target) break;
    }
    if (!target) {
      setNotice('All sample beds are occupied right now. Check out a student or click Reset demo.');
      return;
    }
    const moving = activeOccupant;
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        beds: r.beds.map((b) => {
          if (r.roomNumber === selected.roomNumber && b.label === selected.bedLabel) return { ...b, occupant: null };
          if (r.roomNumber === target!.roomNumber && b.label === target!.bedLabel) return { ...b, occupant: moving };
          return b;
        }),
      })),
    );
    setSelected(null);
    setNotice(`${moving.name} transferred to Room ${target.roomNumber}, bed ${target.bedLabel}. Old bed is free again.`);
  }

  function handleCheckout() {
    if (!selected || !activeOccupant) return;
    const leaving = activeOccupant;
    setRooms((prev) =>
      prev.map((r) =>
        r.roomNumber === selected.roomNumber
          ? { ...r, beds: r.beds.map((b) => (b.label === selected.bedLabel ? { ...b, occupant: null } : b)) }
          : r,
      ),
    );
    setSelected(null);
    setNotice(`${leaving.name} checked out. Room ${selected.roomNumber}, bed ${selected.bedLabel} is free again.`);
  }

  function handleReset() {
    setRooms(cloneRooms(INITIAL_DEMO_ROOMS));
    setSelected(null);
    setWaitlistIndex(0);
    setNotice('Demo reset. Click a free bed to allocate a student, or an occupied bed to transfer or check out.');
  }

  return (
    <section id="rooms" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Rooms and beds, right on the map</h2>
            <p className="mt-2.5 text-base text-slate-600">
              Try moving students between beds right here. Every move in the real app runs atomically inside one database transaction.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white">{stats.total} beds</span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">{stats.taken} occupied</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{stats.free} free</span>
            <Button variant="secondary" size="sm" onClick={handleReset} icon={<RotateCcw className="h-3.5 w-3.5" />}>
              Reset demo
            </Button>
          </div>
        </div>

        <div className="relative mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map((room) => {
              const takenCount = room.beds.filter((b) => b.occupant).length;
              return (
                <div key={room.roomNumber} className="glass p-5 sm:p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-2xl font-extrabold text-ink">{room.roomNumber}</div>
                      <div className="text-xs font-semibold text-slate-600">
                        {room.block}, {room.floorLabel} · {takenCount} of {room.beds.length} beds taken
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
                      initial={false}
                      animate={{ width: `${(takenCount / room.beds.length) * 100}%` }}
                      transition={spring}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {room.beds.map((bed) => {
                      const occ = bed.occupant;
                      const isSelected = selected?.roomNumber === room.roomNumber && selected?.bedLabel === bed.label;
                      return occ ? (
                        <motion.button
                          key={bed.label}
                          layoutId={reducedMotion ? undefined : `demo-bed-${occ.id}`}
                          type="button"
                          data-demo-bed="true"
                          onClick={() => setSelected({ roomNumber: room.roomNumber, bedLabel: bed.label })}
                          whileHover={reducedMotion ? undefined : { y: -3 }}
                          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                          transition={spring}
                          className={clsx(
                            'clay-tile flex min-w-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 px-3 py-2.5 text-left text-xs font-bold text-white',
                            isSelected && 'ring-4 ring-indigo-300',
                          )}
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/20">{bed.label}</span>
                          <span className="truncate">{occ.name.split(' ')[0]}</span>
                        </motion.button>
                      ) : (
                        <motion.button
                          key={bed.label}
                          type="button"
                          data-demo-bed="true"
                          onClick={() => handleAllocate(room.roomNumber, bed.label)}
                          animate={reducedMotion ? undefined : { opacity: [0.88, 1, 0.88] }}
                          transition={reducedMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                          whileHover={reducedMotion ? undefined : { y: -3 }}
                          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                          className="flex min-w-0 items-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/75 px-3 py-2.5 text-left text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white text-emerald-700">{bed.label}</span>
                          <span className="truncate">Free</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {selected && activeOccupant && (
              <motion.div
                ref={actionCardRef}
                role="dialog"
                aria-label={`${activeOccupant.name} in Room ${selected.roomNumber}, bed ${selected.bedLabel}`}
                initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.14 } }}
                transition={spring}
                className="glass-strong mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div>
                  <div className="font-display text-lg font-extrabold text-ink">{activeOccupant.name}</div>
                  <div className="text-xs font-medium text-slate-600">
                    Room {selected.roomNumber}, bed {selected.bedLabel} · {activeOccupant.roll}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={handleTransfer} disabled={stats.free === 0} icon={<ArrowRightLeft className="h-4 w-4" />}>
                    Transfer
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleCheckout} icon={<LogOut className="h-4 w-4" />}>
                    Check out
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-ink"
                    aria-label="Close bed options"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-white"
          >
            {notice}
          </div>
        </div>
      </div>
    </section>
  );
}
