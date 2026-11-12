import { Router } from 'express';
import Allocation from '../models/Allocation.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { runInTransaction } from '../utils/transaction.js';
import { asyncHandler, badRequest, conflict, notFound, requireId, str, isValidId } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

const POPULATE = [
  { path: 'studentId', select: 'name email rollNumber phone' },
  { path: 'roomId', select: 'block floor roomNumber' },
];

/** Validates the student, room and bed before any write. */
async function resolveTarget(studentId, roomId, bedLabel) {
  requireId(studentId, 'student');
  requireId(roomId, 'room');
  const student = await User.findOne({ _id: studentId, role: 'student' }).lean();
  if (!student) throw notFound('Student not found.');
  if (!student.isActive) throw badRequest('This student account is deactivated.');
  const room = await Room.findById(roomId).lean();
  if (!room) throw notFound('Room not found.');
  const label = str(bedLabel, 5).toUpperCase();
  if (!room.beds.some((b) => b.label === label)) throw badRequest(`Room ${room.roomNumber} has no bed "${label || '?'}".`);
  return { student, room, label };
}

// Student: current room, roommates and history.
router.get(
  '/me',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    const history = await Allocation.find({ studentId: req.user._id }).sort({ startDate: -1 }).populate(POPULATE).lean();
    const current = history.find((a) => a.status === 'active') || null;
    let roommates = [];
    if (current?.roomId) {
      const others = await Allocation.find({ roomId: current.roomId._id, status: 'active', studentId: { $ne: req.user._id } })
        .populate('studentId', 'name rollNumber')
        .lean();
      roommates = others.map((o) => ({ bedLabel: o.bedLabel, name: o.studentId?.name, rollNumber: o.studentId?.rollNumber }));
    }
    res.json({ current, history, roommates });
  }),
);

router.get(
  '/',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status === 'active' || req.query.status === 'ended') filter.status = req.query.status;
    if (isValidId(req.query.studentId)) filter.studentId = req.query.studentId;
    const allocations = await Allocation.find(filter).sort({ startDate: -1 }).limit(1000).populate(POPULATE).lean();
    res.json({ allocations });
  }),
);

router.get(
  '/student/:id',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const allocations = await Allocation.find({ studentId: requireId(req.params.id, 'student id') })
      .sort({ startDate: -1 })
      .populate(POPULATE)
      .lean();
    res.json({ allocations });
  }),
);

// Allocate a student who currently has no room.
router.post(
  '/',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const { studentId, roomId, bedLabel } = req.body || {};
    const { room, label } = await resolveTarget(studentId, roomId, bedLabel);
    if (await Allocation.exists({ studentId, status: 'active' })) {
      throw conflict('This student already has a room. Use Transfer instead.');
    }
    if (await Allocation.exists({ roomId: room._id, bedLabel: label, status: 'active' })) {
      throw conflict('That bed is already occupied.');
    }
    // The partial unique indexes still protect against two wardens clicking at the same moment.
    const allocation = await Allocation.create({ studentId, roomId: room._id, bedLabel: label, createdBy: req.user._id });
    await allocation.populate(POPULATE);
    res.status(201).json({ allocation });
  }),
);

// Move a student: end the old allocation and create the new one atomically.
router.post(
  '/transfer',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const { studentId, roomId, bedLabel } = req.body || {};
    const { room, label } = await resolveTarget(studentId, roomId, bedLabel);

    const created = await runInTransaction(async (session) => {
      const current = await Allocation.findOne({ studentId, status: 'active' }).session(session);
      if (!current) throw notFound('This student has no room yet. Use Allocate instead.');
      if (String(current.roomId) === String(room._id) && current.bedLabel === label) {
        throw badRequest('The student is already in that bed.');
      }
      if (await Allocation.exists({ roomId: room._id, bedLabel: label, status: 'active' }).session(session)) {
        throw conflict('That bed is already occupied.');
      }

      current.status = 'ended';
      current.endDate = new Date();
      current.endReason = 'transfer';
      current.endedBy = req.user._id;
      await current.save({ session });

      try {
        const [allocation] = await Allocation.create(
          [{ studentId, roomId: room._id, bedLabel: label, createdBy: req.user._id }],
          { session },
        );
        return allocation;
      } catch (err) {
        // Without a transaction (local standalone MongoDB), put the original allocation back by hand.
        if (!session) {
          await Allocation.updateOne(
            { _id: current._id },
            { $set: { status: 'active' }, $unset: { endDate: 1, endReason: 1, endedBy: 1 } },
          );
        }
        throw err;
      }
    });

    await created.populate(POPULATE);
    res.status(201).json({ allocation: created });
  }),
);

router.post(
  '/checkout',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const studentId = requireId(req.body?.studentId, 'student');
    const current = await Allocation.findOne({ studentId, status: 'active' });
    if (!current) throw notFound('This student has no active room allocation.');
    current.status = 'ended';
    current.endDate = new Date();
    current.endReason = 'checkout';
    current.endedBy = req.user._id;
    await current.save();
    await current.populate(POPULATE);
    res.json({ allocation: current });
  }),
);

export default router;
