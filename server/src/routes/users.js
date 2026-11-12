import { Router } from 'express';
import User from '../models/User.js';
import Allocation from '../models/Allocation.js';
import Complaint from '../models/Complaint.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, SPECIALIZATIONS } from '../constants.js';
import { asyncHandler, badRequest, notFound, requireId, str, escapeRegex, sameId } from '../utils/http.js';

const router = Router();
router.use(requireAuth, requireRole('warden'));

const COLLATION = { locale: 'en', strength: 2 };

// GET /api/users?role=student&q=&unallocated=true&active=true
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    const role = str(req.query.role, 20);
    if (role && ROLES.includes(role)) filter.role = role;
    if (req.query.active === 'true') filter.isActive = true;
    const q = str(req.query.q, 80);
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { rollNumber: rx }];
    }
    let users = await User.find(filter).sort({ name: 1 }).collation(COLLATION).limit(1000).lean();

    const studentIds = users.filter((u) => u.role === 'student').map((u) => u._id);
    if (studentIds.length) {
      const active = await Allocation.find({ status: 'active', studentId: { $in: studentIds } })
        .populate('roomId', 'block floor roomNumber')
        .lean();
      const byStudent = new Map(active.map((a) => [String(a.studentId), a]));
      users = users.map((u) => {
        if (u.role !== 'student') return u;
        const a = byStudent.get(String(u._id));
        return {
          ...u,
          currentAllocation: a ? { _id: a._id, roomId: a.roomId, bedLabel: a.bedLabel, startDate: a.startDate } : null,
        };
      });
      if (req.query.unallocated === 'true') users = users.filter((u) => u.role === 'student' && !u.currentAllocation);
    }
    res.json({ users });
  }),
);

// Maintenance staff with their current workload, used when assigning complaints.
router.get(
  '/technicians',
  asyncHandler(async (_req, res) => {
    const techs = await User.find({ role: 'maintenance' }).sort({ name: 1 }).collation(COLLATION).lean();
    const load = await Complaint.aggregate([
      { $match: { assignedTo: { $in: techs.map((t) => t._id) }, status: { $in: ['assigned', 'in_progress'] } } },
      { $group: { _id: '$assignedTo', open: { $sum: 1 } } },
    ]);
    const byId = new Map(load.map((l) => [String(l._id), l.open]));
    res.json({ technicians: techs.map((t) => ({ ...t, openJobs: byId.get(String(t._id)) || 0 })) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, rollNumber, specialization } = req.body || {};
    if (!ROLES.includes(role)) throw badRequest('Choose a valid role.');
    if (typeof password !== 'string' || password.length < 6) throw badRequest('Password must be at least 6 characters.');
    const spec = str(specialization, 30);
    if (role === 'maintenance' && spec && !SPECIALIZATIONS.includes(spec)) throw badRequest('Choose a valid specialization.');
    const user = await User.create({
      name: str(name, 80),
      email: str(email, 120),
      role,
      phone: str(phone, 20) || undefined,
      rollNumber: role === 'student' ? str(rollNumber, 30) || undefined : undefined,
      specialization: role === 'maintenance' ? spec || 'general' : undefined,
      passwordHash: await User.hashPassword(password),
    });
    res.status(201).json({ user });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(requireId(req.params.id, 'user id'));
    if (!user) throw notFound('User not found.');
    const { name, phone, rollNumber, specialization, isActive } = req.body || {};

    if (typeof isActive === 'boolean' && isActive !== user.isActive) {
      if (!isActive && sameId(user._id, req.user._id)) throw badRequest("You can't deactivate your own account.");
      if (!isActive && user.role === 'student' && (await Allocation.exists({ studentId: user._id, status: 'active' }))) {
        throw badRequest('Check this student out of their room before deactivating the account.');
      }
      user.isActive = isActive;
    }
    if (name !== undefined) user.name = str(name, 80);
    if (phone !== undefined) user.phone = str(phone, 20) || undefined;
    if (rollNumber !== undefined && user.role === 'student') user.rollNumber = str(rollNumber, 30) || undefined;
    if (specialization !== undefined && user.role === 'maintenance') {
      if (!SPECIALIZATIONS.includes(specialization)) throw badRequest('Choose a valid specialization.');
      user.specialization = specialization;
    }
    await user.save();
    res.json({ user });
  }),
);

export default router;
