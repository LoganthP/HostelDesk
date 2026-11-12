/**
 * Resets the database and loads demo data.
 * Usage: npm run seed   (from /server, or from the project root)
 */
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB, ensureIndexes } from './config/db.js';
import User from './models/User.js';
import Room from './models/Room.js';
import Allocation from './models/Allocation.js';
import Complaint from './models/Complaint.js';

// A unique demo password (common ones like "password123" trigger browser breach warnings).
const PASSWORD = 'HostelDesk#Demo26';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms) => new Date(now - ms);

async function seed() {
  await connectDB();
  console.log(`Resetting database "${env.dbName}"…`);
  await Promise.all([User.deleteMany({}), Room.deleteMany({}), Allocation.deleteMany({}), Complaint.deleteMany({})]);
  await mongoose.connection.db.collection('sessions').deleteMany({}).catch(() => {});
  await ensureIndexes();

  const passwordHash = await User.hashPassword(PASSWORD);
  const u = (name, email, role, extra = {}) => ({ name, email, role, passwordHash, ...extra });
  const [warden, ravi, suresh, anil, farhan, arjun, priya, kiran, neha] = await User.create([
    u('Meera Rao', 'warden@hostel.edu', 'warden', { phone: '9845000001' }),
    u('Ravi Kumar', 'ravi@hostel.edu', 'maintenance', { specialization: 'plumbing', phone: '9845000011' }),
    u('Suresh Gowda', 'suresh@hostel.edu', 'maintenance', { specialization: 'electrical', phone: '9845000012' }),
    u('Anil Shetty', 'anil@hostel.edu', 'maintenance', { specialization: 'carpentry', phone: '9845000013' }),
    u('Farhan Ali', 'it@hostel.edu', 'maintenance', { specialization: 'wifi', phone: '9845000014' }),
    u('Arjun Nair', 'arjun@student.edu', 'student', { rollNumber: '4VV23CS011' }),
    u('Priya Sharma', 'priya@student.edu', 'student', { rollNumber: '4VV23CS042' }),
    u('Kiran Patil', 'kiran@student.edu', 'student', { rollNumber: '4VV23CS057' }),
    u('Neha Iyer', 'neha@student.edu', 'student', { rollNumber: '4VV23CS068' }),
  ]);
  await User.create([
    u('Rahul Verma', 'rahul@student.edu', 'student', { rollNumber: '4VV23CS073' }),
    u('Sneha Reddy', 'sneha@student.edu', 'student', { rollNumber: '4VV23CS081' }),
  ]);

  const roomDefs = [
    ['A', 1, 'A101', 2], ['A', 1, 'A102', 3], ['A', 1, 'A103', 2], ['A', 2, 'A201', 2], ['A', 2, 'A202', 3],
    ['B', 1, 'B101', 2], ['B', 1, 'B102', 2], ['B', 1, 'B103', 3], ['B', 2, 'B201', 2],
  ];
  const rooms = await Room.create(
    roomDefs.map(([block, floor, roomNumber, n]) => ({
      block, floor, roomNumber, beds: Array.from({ length: n }, (_, i) => ({ label: String.fromCharCode(65 + i) })),
    })),
  );
  const room = Object.fromEntries(rooms.map((r) => [r.roomNumber, r]));

  await Allocation.create([
    // Arjun moved from A103 to A101 a month ago — his history shows both.
    { studentId: arjun._id, roomId: room.A103._id, bedLabel: 'A', status: 'ended', startDate: ago(120 * DAY), endDate: ago(30 * DAY), endReason: 'transfer', createdBy: warden._id, endedBy: warden._id },
    { studentId: arjun._id, roomId: room.A101._id, bedLabel: 'A', startDate: ago(30 * DAY), createdBy: warden._id },
    { studentId: kiran._id, roomId: room.A101._id, bedLabel: 'B', startDate: ago(90 * DAY), createdBy: warden._id },
    { studentId: priya._id, roomId: room.B101._id, bedLabel: 'A', startDate: ago(100 * DAY), createdBy: warden._id },
    { studentId: neha._id, roomId: room.B102._id, bedLabel: 'B', startDate: ago(80 * DAY), createdBy: warden._id },
  ]);

  const roomLoc = (r, bed) => ({ kind: 'room', roomId: r._id, block: r.block, floor: r.floor, roomNumber: r.roomNumber, bedLabel: bed });
  const step = (from, to, action, user, at, note) => ({ from, to, action, note, by: user._id, byName: user.name, byRole: user.role, at });

  /** Builds a complaint whose timeline starts `daysAgo` and follows the given steps (hours after creation). */
  function complaint({ student, location, category, title, description, details = {}, priority = 'medium', daysAgo, steps = [], notes = [] }) {
    const createdAt = ago(daysAgo * DAY);
    const t = (h) => new Date(createdAt.getTime() + h * HOUR);
    const history = [step(null, 'submitted', 'submitted', student, createdAt)];
    let status = 'submitted';
    let assignedTo = null;
    let resolvedAt = null;
    let closedAt = null;
    for (const [to, action, user, h, note] of steps) {
      history.push(step(status, to, action, user, t(h), note));
      status = to;
      if (to === 'resolved') resolvedAt = t(h);
      if (to === 'reopened') resolvedAt = null;
      if (to === 'closed') closedAt = t(h);
    }
    return {
      doc: {
        studentId: student._id, location, category, title, description, details, priority, status, assignedTo,
        statusHistory: history, resolvedAt, closedAt,
        reopenCount: history.filter((s) => s.to === 'reopened').length,
        notes: notes.map(([user, h, text]) => ({ text, by: user._id, byName: user.name, byRole: user.role, at: t(h) })),
      },
      createdAt,
      updatedAt: history[history.length - 1].at,
    };
  }
  const withTech = (c, tech) => ({ ...c, doc: { ...c.doc, assignedTo: c.doc.status === 'submitted' ? null : tech._id } });

  const items = [
    withTech(complaint({
      student: arjun, location: roomLoc(room.A101, 'A'), category: 'plumbing', priority: 'high', daysAgo: 12,
      title: 'Bathroom tap is leaking', description: 'The wash-basin tap drips constantly and the floor stays wet.',
      details: { fixture: 'Wash-basin tap' },
      steps: [
        ['assigned', 'assigned', warden, 2, 'Assigned to Ravi Kumar'],
        ['in_progress', 'started', ravi, 5],
        ['resolved', 'resolved', ravi, 9, 'Replaced the worn washer and tightened the valve.'],
        ['closed', 'confirmed', arjun, 20, 'Repair confirmed by student'],
      ],
      notes: [[ravi, 9, 'Replaced the worn washer and tightened the valve.']],
    }), ravi),
    withTech(complaint({
      student: kiran, location: roomLoc(room.A101, 'B'), category: 'electrical', daysAgo: 3,
      title: 'Ceiling fan makes a grinding noise', description: 'Fan is noisy at every speed and wobbles a little.',
      details: { appliance: 'Ceiling fan' },
      steps: [
        ['assigned', 'assigned', warden, 1, 'Assigned to Suresh Gowda'],
        ['in_progress', 'started', suresh, 20],
        ['resolved', 'resolved', suresh, 26, 'Greased the bearing and balanced the blades.'],
      ],
      notes: [[suresh, 26, 'Greased the bearing and balanced the blades.']],
    }), suresh),
    withTech(complaint({
      student: priya, location: roomLoc(room.B101, 'A'), category: 'wifi', priority: 'high', daysAgo: 2,
      title: 'Wi-Fi keeps disconnecting', description: 'Connection drops every few minutes in the evening, making online classes difficult.',
      details: { network: 'HOSTEL-B', accessPoint: '1st floor corridor' },
      steps: [
        ['assigned', 'assigned', warden, 3, 'Assigned to Farhan Ali'],
        ['in_progress', 'started', farhan, 22],
      ],
      notes: [[farhan, 23, 'Access point firmware is outdated. Update scheduled tonight.']],
    }), farhan),
    // An active job waiting for the plumber, so his dashboard has work to start in a demo.
    withTech(complaint({
      student: arjun, location: roomLoc(room.A101, 'A'), category: 'plumbing', priority: 'high', daysAgo: 0.3,
      title: 'Shower drain is clogged', description: 'Water collects in the shower area and drains very slowly.',
      details: { fixture: 'Shower drain' },
      steps: [['assigned', 'assigned', warden, 1, 'Assigned to Ravi Kumar']],
    }), ravi),
    withTech(complaint({
      student: neha, location: roomLoc(room.B102, 'B'), category: 'carpentry', priority: 'low', daysAgo: 1,
      title: 'Cupboard door hinge is broken', description: 'The left cupboard door hangs loose and does not close.',
      details: { item: 'Cupboard door' },
      steps: [['assigned', 'assigned', warden, 4, 'Assigned to Anil Shetty']],
    }), anil),
    withTech(complaint({
      student: neha, location: roomLoc(room.B102, 'B'), category: 'electrical', daysAgo: 6,
      title: 'Tube light flickers', description: 'The tube light flickers and switches off by itself at night.',
      details: { appliance: 'Tube light' },
      steps: [
        ['assigned', 'assigned', warden, 2, 'Assigned to Suresh Gowda'],
        ['in_progress', 'started', suresh, 18],
        ['resolved', 'resolved', suresh, 30, 'Replaced the starter.'],
        ['reopened', 'reopened', neha, 50, 'Still flickering after 10 pm.'],
      ],
      notes: [[suresh, 30, 'Replaced the starter.']],
    }), suresh),
    withTech(complaint({
      student: kiran, location: { kind: 'shared', block: 'A', floor: 1, area: 'Common bathroom' }, category: 'plumbing', daysAgo: 8,
      title: 'No hot water in showers', description: 'All three showers in the first-floor common bathroom run cold.',
      details: { fixture: 'Shower / geyser' },
      steps: [
        ['assigned', 'assigned', warden, 3, 'Assigned to Ravi Kumar'],
        ['in_progress', 'started', ravi, 8],
        ['resolved', 'resolved', ravi, 30, 'Geyser thermostat replaced.'],
        ['closed', 'closed', warden, 40, 'Verified and closed by warden'],
      ],
      notes: [[ravi, 30, 'Geyser thermostat replaced.']],
    }), ravi),
    withTech(complaint({
      student: arjun, location: roomLoc(room.A103, 'A'), category: 'wifi', daysAgo: 40,
      title: 'Very slow Wi-Fi in room', description: 'Speed tests show under 1 Mbps in the room.',
      details: { network: 'HOSTEL-A' },
      steps: [
        ['assigned', 'assigned', warden, 2, 'Assigned to Farhan Ali'],
        ['in_progress', 'started', farhan, 24],
        ['resolved', 'resolved', farhan, 48, 'Added a repeater on the corridor.'],
        ['closed', 'confirmed', arjun, 60, 'Repair confirmed by student'],
      ],
      notes: [[farhan, 48, 'Added a repeater on the corridor.']],
    }), farhan),
    complaint({
      student: arjun, location: { kind: 'shared', block: 'A', floor: 2, area: '2nd floor corridor' }, category: 'cleaning', daysAgo: 0.2,
      title: 'Corridor has not been cleaned', description: 'Rubbish has been piling up near the stairs since yesterday.',
    }),
    complaint({
      student: priya, location: { kind: 'shared', block: 'B', floor: 1, area: 'Common bathroom' }, category: 'pest_control', priority: 'medium', daysAgo: 0.1,
      title: 'Cockroaches in the common bathroom', description: 'Seen several cockroaches near the drains, especially at night.',
      details: { pest: 'Cockroaches' },
    }),
  ];

  for (const item of items) {
    const created = await Complaint.create(item.doc);
    // Backdate timestamps so the reports have realistic resolution times.
    await Complaint.collection.updateOne({ _id: created._id }, { $set: { createdAt: item.createdAt, updatedAt: item.updatedAt } });
  }

  console.log('\n✔ Demo data loaded. Every account uses the password:', PASSWORD);
  console.table([
    { role: 'Warden', email: 'warden@hostel.edu' },
    { role: 'Maintenance (plumbing)', email: 'ravi@hostel.edu' },
    { role: 'Maintenance (electrical)', email: 'suresh@hostel.edu' },
    { role: 'Maintenance (carpentry)', email: 'anil@hostel.edu' },
    { role: 'Maintenance (IT support / Wi-Fi)', email: 'it@hostel.edu' },
    { role: 'Student (Room A101)', email: 'arjun@student.edu' },
    { role: 'Student (Room A101, repair to confirm)', email: 'kiran@student.edu' },
    { role: 'Student (Room B101)', email: 'priya@student.edu' },
    { role: 'Student (no room yet)', email: 'rahul@student.edu' },
  ]);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('✖ Seeding failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
