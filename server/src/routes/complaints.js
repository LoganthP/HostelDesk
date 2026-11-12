import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import Allocation from '../models/Allocation.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js';
import {
  asyncHandler, badRequest, forbidden, notFound, conflict, requireId, str, escapeRegex, isValidId, sameId,
} from '../utils/http.js';
import { POPULATE, transition, assertStatus, canView, cleanDetails, joinNotes } from '../services/complaintWorkflow.js';

const router = Router();
router.use(requireAuth);

/** Students see their own complaints, technicians see their jobs, wardens see everything. */
function scopeFor(user) {
  if (user.role === 'student') return { studentId: user._id };
  if (user.role === 'maintenance') return { assignedTo: user._id };
  return {};
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = scopeFor(req.user);
    const { status, category, priority, block, q, assignedTo } = req.query;

    const statuses = str(status, 120).split(',').filter((s) => STATUSES.includes(s));
    if (statuses.length) filter.status = { $in: statuses };
    if (CATEGORIES.includes(category)) filter.category = category;
    if (PRIORITIES.includes(priority)) filter.priority = priority;
    if (str(block, 20)) filter['location.block'] = str(block, 20).toUpperCase();
    if (req.user.role === 'warden' && assignedTo) {
      if (assignedTo === 'unassigned') filter.assignedTo = null;
      else if (isValidId(assignedTo)) filter.assignedTo = assignedTo;
    }
    const search = str(q, 100);
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { 'location.roomNumber': rx }, { 'location.area': rx }];
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 300, 1), 500);

    const complaints = await Complaint.find(filter)
      .select('-statusHistory -notes')
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ complaints });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(requireId(req.params.id, 'complaint id')).populate(POPULATE).lean();
    if (!complaint) throw notFound('Complaint not found.');
    if (!canView(req.user, complaint)) throw forbidden("You don't have access to this complaint.");
    res.json({ complaint });
  }),
);

// Student submits a complaint for their own room or a shared area.
router.post(
  '/',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    const { category, title, description, locationType, block, floor, area, details } = req.body || {};
    if (!CATEGORIES.includes(category)) throw badRequest('Choose a category.');
    const t = str(title, 120);
    const d = str(description, 2000);
    if (t.length < 3) throw badRequest('Give the complaint a short title (at least 3 characters).');
    if (d.length < 5) throw badRequest('Describe the problem (at least 5 characters).');

    let location;
    if (locationType === 'shared') {
      const b = str(block, 20).toUpperCase();
      const a = str(area, 120);
      if (!b) throw badRequest('Choose the block where the shared area is.');
      if (!a) throw badRequest('Describe the shared area, for example "2nd floor corridor".');
      let f;
      if (floor !== undefined && floor !== null && floor !== '') {
        f = Number(floor);
        if (!Number.isInteger(f) || f < 0 || f > 100) throw badRequest('Floor must be a whole number.');
      }
      location = { kind: 'shared', block: b, floor: f, area: a };
    } else {
      const allocation = await Allocation.findOne({ studentId: req.user._id, status: 'active' }).populate('roomId').lean();
      if (!allocation?.roomId) {
        throw badRequest("You don't have a room allocated yet. Report this as a shared area instead.");
      }
      const r = allocation.roomId;
      location = { kind: 'room', roomId: r._id, block: r.block, floor: r.floor, roomNumber: r.roomNumber, bedLabel: allocation.bedLabel };
    }

    const complaint = new Complaint({
      studentId: req.user._id,
      location,
      category,
      title: t,
      description: d,
      details: cleanDetails(details),
      status: 'submitted',
      statusHistory: [
        { from: null, to: 'submitted', action: 'submitted', by: req.user._id, byName: req.user.name, byRole: req.user.role, at: new Date() },
      ],
    });
    await complaint.save();
    await complaint.populate(POPULATE);
    res.status(201).json({ complaint });
  }),
);

async function loadComplaint(req) {
  const complaint = await Complaint.findById(requireId(req.params.id, 'complaint id'));
  if (!complaint) throw notFound('Complaint not found.');
  return complaint;
}

async function saveAndRespond(res, complaint) {
  await complaint.save();
  await complaint.populate(POPULATE);
  res.json({ complaint });
}

function requireAssignee(user, complaint) {
  if (!sameId(complaint.assignedTo, user._id)) throw forbidden('This job is not assigned to you.');
}

function requireOwner(user, complaint) {
  if (!sameId(complaint.studentId, user._id)) throw forbidden("You don't have access to this complaint.");
}

// Warden assigns or reassigns a technician, and/or changes priority.
router.patch(
  '/:id/assign',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    assertStatus(complaint, ['submitted', 'reopened', 'assigned', 'in_progress'], 'assign');
    const { assignedTo, priority } = req.body || {};
    const note = str(req.body?.note, 1000);

    requireId(assignedTo, 'technician');
    const tech = await User.findOne({ _id: assignedTo, role: 'maintenance', isActive: true }).lean();
    if (!tech) throw badRequest('Choose an active maintenance staff member.');

    let priorityNote;
    if (priority !== undefined && priority !== complaint.priority) {
      if (!PRIORITIES.includes(priority)) throw badRequest('Choose a valid priority.');
      priorityNote = `Priority changed from ${complaint.priority} to ${priority}`;
      complaint.priority = priority;
    }

    const techChanged = !sameId(complaint.assignedTo, tech._id);
    if (['submitted', 'reopened'].includes(complaint.status) || techChanged) {
      const action = complaint.assignedTo && techChanged ? 'reassigned' : 'assigned';
      complaint.assignedTo = tech._id;
      complaint.assignedAt = new Date();
      transition(complaint, { to: 'assigned', action, user: req.user, note: joinNotes(`Assigned to ${tech.name}`, priorityNote, note) });
    } else if (priorityNote) {
      transition(complaint, { to: complaint.status, action: 'priority_changed', user: req.user, note: joinNotes(priorityNote, note) });
    } else {
      throw badRequest('Nothing changed. Pick a different technician or priority.');
    }
    await saveAndRespond(res, complaint);
  }),
);

router.patch(
  '/:id/start',
  requireRole('maintenance'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    requireAssignee(req.user, complaint);
    assertStatus(complaint, ['assigned'], 'start work on');
    transition(complaint, { to: 'in_progress', action: 'started', user: req.user, note: str(req.body?.note, 1000) });
    await saveAndRespond(res, complaint);
  }),
);

router.patch(
  '/:id/resolve',
  requireRole('maintenance'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    requireAssignee(req.user, complaint);
    assertStatus(complaint, ['in_progress'], 'resolve');
    const note = str(req.body?.note, 1000);
    if (note.length < 3) throw badRequest('Add a repair note describing what was fixed.');
    complaint.notes.push({ text: note, by: req.user._id, byName: req.user.name, byRole: req.user.role });
    complaint.resolvedAt = new Date();
    transition(complaint, { to: 'resolved', action: 'resolved', user: req.user, note });
    await saveAndRespond(res, complaint);
  }),
);

// Repair notes from the assigned technician or the warden.
router.post(
  '/:id/notes',
  requireRole('maintenance', 'warden'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    if (req.user.role === 'maintenance') requireAssignee(req.user, complaint);
    if (complaint.status === 'closed') throw conflict('This complaint is closed.');
    const text = str(req.body?.text, 1000);
    if (!text) throw badRequest('Write a note first.');
    complaint.notes.push({ text, by: req.user._id, byName: req.user.name, byRole: req.user.role });
    await saveAndRespond(res, complaint);
  }),
);

router.patch(
  '/:id/confirm',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    requireOwner(req.user, complaint);
    assertStatus(complaint, ['resolved'], 'confirm');
    complaint.closedAt = new Date();
    transition(complaint, { to: 'closed', action: 'confirmed', user: req.user, note: str(req.body?.note, 1000) || 'Repair confirmed by student' });
    await saveAndRespond(res, complaint);
  }),
);

router.patch(
  '/:id/reopen',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    requireOwner(req.user, complaint);
    assertStatus(complaint, ['resolved'], 'reopen');
    const reason = str(req.body?.reason, 1000);
    if (reason.length < 5) throw badRequest('Tell the warden why the problem is not fixed (at least 5 characters).');
    complaint.reopenCount += 1;
    complaint.resolvedAt = null;
    transition(complaint, { to: 'reopened', action: 'reopened', user: req.user, note: reason });
    await saveAndRespond(res, complaint);
  }),
);

router.patch(
  '/:id/close',
  requireRole('warden'),
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaint(req);
    assertStatus(complaint, ['resolved'], 'close');
    complaint.closedAt = new Date();
    transition(complaint, { to: 'closed', action: 'closed', user: req.user, note: str(req.body?.note, 1000) || 'Verified and closed by warden' });
    await saveAndRespond(res, complaint);
  }),
);

export default router;
