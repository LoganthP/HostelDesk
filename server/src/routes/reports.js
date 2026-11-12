import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import Room from '../models/Room.js';
import Allocation from '../models/Allocation.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
router.use(requireAuth, requireRole('warden'));

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [rooms, bedAgg, occupied, students, technicians, byStatus, urgentOpen] = await Promise.all([
      Room.countDocuments(),
      Room.aggregate([{ $group: { _id: null, beds: { $sum: { $size: '$beds' } } } }]),
      Allocation.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'maintenance', isActive: true }),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.countDocuments({ priority: 'urgent', status: { $nin: ['resolved', 'closed'] } }),
    ]);
    const status = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const totalBeds = bedAgg[0]?.beds || 0;
    res.json({
      rooms,
      beds: totalBeds,
      occupied,
      available: totalBeds - occupied,
      students,
      technicians,
      complaints: {
        byStatus: status,
        total: byStatus.reduce((n, s) => n + s.count, 0),
        open: ['submitted', 'assigned', 'in_progress', 'reopened'].reduce((n, k) => n + (status[k] || 0), 0),
        needsAssignment: (status.submitted || 0) + (status.reopened || 0),
        urgentOpen,
      },
    });
  }),
);

// 1. Recurring problems: complaints grouped by hostel block and category.
router.get(
  '/by-category-block',
  asyncHandler(async (_req, res) => {
    const rows = await Complaint.aggregate([
      {
        $group: {
          _id: { block: '$location.block', category: '$category' },
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 0, 1] } },
        },
      },
      { $project: { _id: 0, block: '$_id.block', category: '$_id.category', total: 1, open: 1 } },
      { $sort: { block: 1, total: -1 } },
    ]);
    res.json({ rows });
  }),
);

// 2. Average time from submission to resolution, per category.
router.get(
  '/resolution-time',
  asyncHandler(async (_req, res) => {
    const rows = await Complaint.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      { $project: { category: 1, hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } } },
      {
        $group: {
          _id: '$category',
          avgHours: { $avg: '$hours' },
          minHours: { $min: '$hours' },
          maxHours: { $max: '$hours' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          avgHours: { $round: ['$avgHours', 1] },
          minHours: { $round: ['$minHours', 1] },
          maxHours: { $round: ['$maxHours', 1] },
        },
      },
      { $sort: { avgHours: -1 } },
    ]);
    res.json({ rows });
  }),
);

// 3. Occupancy: bed counts per block compared with active allocations.
router.get(
  '/occupancy',
  asyncHandler(async (_req, res) => {
    const rows = await Room.aggregate([
      { $project: { block: 1, bedCount: { $size: '$beds' } } },
      {
        $lookup: {
          from: Allocation.collection.name,
          let: { roomId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$roomId', '$$roomId'] }, { $eq: ['$status', 'active'] }] } } },
            { $count: 'n' },
          ],
          as: 'active',
        },
      },
      { $project: { block: 1, bedCount: 1, occupied: { $ifNull: [{ $arrayElemAt: ['$active.n', 0] }, 0] } } },
      { $group: { _id: '$block', rooms: { $sum: 1 }, beds: { $sum: '$bedCount' }, occupied: { $sum: '$occupied' } } },
      {
        $project: {
          _id: 0,
          block: '$_id',
          rooms: 1,
          beds: 1,
          occupied: 1,
          available: { $subtract: ['$beds', '$occupied'] },
          occupancyRate: {
            $cond: [{ $gt: ['$beds', 0] }, { $round: [{ $multiply: [{ $divide: ['$occupied', '$beds'] }, 100] }, 1] }, 0],
          },
        },
      },
      { $sort: { block: 1 } },
    ]);
    res.json({ rows });
  }),
);

export default router;
