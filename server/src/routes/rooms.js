import { Router } from 'express';
import Room from '../models/Room.js';
import Allocation from '../models/Allocation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, badRequest, conflict, notFound, requireId, str } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

const NUMERIC = { locale: 'en', numericOrdering: true };

/** Rooms with each bed's current occupant (if any). */
async function roomsWithOccupancy(filter = {}) {
  const rooms = await Room.find(filter).sort({ block: 1, floor: 1, roomNumber: 1 }).collation(NUMERIC).lean();
  const allocations = await Allocation.find({ status: 'active', roomId: { $in: rooms.map((r) => r._id) } })
    .populate('studentId', 'name email rollNumber')
    .lean();
  const byBed = new Map(allocations.map((a) => [`${a.roomId}:${a.bedLabel}`, a]));
  return rooms.map((room) => {
    const beds = room.beds.map((bed) => {
      const a = byBed.get(`${room._id}:${bed.label}`);
      return { label: bed.label, occupant: a ? { allocationId: a._id, startDate: a.startDate, student: a.studentId } : null };
    });
    return { ...room, beds, occupiedCount: beds.filter((b) => b.occupant).length };
  });
}

function parseBedLabels(beds, bedCount) {
  if (Array.isArray(beds) && beds.length) {
    return beds.map((b) => str(String(b), 5).toUpperCase()).filter(Boolean);
  }
  const n = Number(bedCount);
  if (!Number.isInteger(n) || n < 1 || n > 12) throw badRequest('Number of beds must be between 1 and 12.');
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i)); // A, B, C…
}

function parseFloor(floor) {
  const f = Number(floor);
  if (floor === '' || floor === null || floor === undefined || !Number.isInteger(f) || f < 0 || f > 100) {
    throw badRequest('Floor must be a whole number (0 for ground floor).');
  }
  return f;
}

// Available to every signed-in user (students pick a block for shared-area complaints).
router.get(
  '/blocks',
  asyncHandler(async (_req, res) => {
    const blocks = (await Room.distinct('block')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    res.json({ blocks });
  }),
);

router.get(
  '/',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const block = str(req.query.block, 20).toUpperCase();
    res.json({ rooms: await roomsWithOccupancy(block ? { block } : {}) });
  }),
);

router.get(
  '/available-beds',
  requireRole('warden'),
  asyncHandler(async (_req, res) => {
    const rooms = await roomsWithOccupancy();
    const beds = rooms.flatMap((r) =>
      r.beds
        .filter((b) => !b.occupant)
        .map((b) => ({ roomId: r._id, block: r.block, floor: r.floor, roomNumber: r.roomNumber, bedLabel: b.label })),
    );
    res.json({ beds });
  }),
);

router.post(
  '/',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const { block, floor, roomNumber, beds, bedCount } = req.body || {};
    const room = await Room.create({
      block: str(block, 20),
      floor: parseFloor(floor),
      roomNumber: str(roomNumber, 20),
      beds: parseBedLabels(beds, bedCount).map((label) => ({ label })),
    });
    const [withBeds] = await roomsWithOccupancy({ _id: room._id });
    res.status(201).json({ room: withBeds });
  }),
);

router.patch(
  '/:id',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const room = await Room.findById(requireId(req.params.id, 'room id'));
    if (!room) throw notFound('Room not found.');
    const { block, floor, roomNumber, beds } = req.body || {};

    if (Array.isArray(beds)) {
      const labels = parseBedLabels(beds);
      const removed = room.beds.map((b) => b.label).filter((l) => !labels.includes(l));
      if (removed.length) {
        const occupied = await Allocation.find({ roomId: room._id, bedLabel: { $in: removed }, status: 'active' }).lean();
        if (occupied.length) {
          throw conflict(`Bed ${occupied.map((o) => o.bedLabel).join(', ')} is occupied. Transfer or check out the student first.`);
        }
      }
      room.beds = labels.map((label) => ({ label }));
    }
    if (floor !== undefined) room.floor = parseFloor(floor);
    if (block !== undefined) room.block = str(block, 20);
    if (roomNumber !== undefined) room.roomNumber = str(roomNumber, 20);
    await room.save();
    const [withBeds] = await roomsWithOccupancy({ _id: room._id });
    res.json({ room: withBeds });
  }),
);

router.delete(
  '/:id',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const room = await Room.findById(requireId(req.params.id, 'room id'));
    if (!room) throw notFound('Room not found.');
    if (await Allocation.exists({ roomId: room._id, status: 'active' })) {
      throw conflict('This room has students in it. Transfer or check them out first.');
    }
    if (await Allocation.exists({ roomId: room._id })) {
      throw conflict('This room has allocation history, which must be preserved, so it cannot be deleted.');
    }
    await room.deleteOne();
    res.json({ ok: true });
  }),
);

export default router;
