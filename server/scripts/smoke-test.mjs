/**
 * API smoke test: run against a FRESHLY SEEDED database while the API is running.
 *   npm run seed && npm run dev      (in another terminal)
 *   npm run test:api --prefix server
 * Optional: API_URL=http://localhost:5000/api DEMO_PASSWORD=...
 */
const B = process.env.API_URL || 'http://localhost:5000/api';
const PASSWORD = process.env.DEMO_PASSWORD || 'HostelDesk#Demo26';
const jars = {};
async function call(who, method, path, body) {
  const res = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(jars[who] ? { Cookie: jars[who] } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get('set-cookie'); if (sc) jars[who] = sc.split(';')[0];
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) process.exitCode = 1; };
const login = async (who, email) => (await call(who, 'POST', '/auth/login', { email, password: PASSWORD })).status;

ok(await login('w', 'warden@hostel.edu') === 200, 'warden login');
ok(await login('s', 'rahul@student.edu') === 200, 'student login');
ok(await login('t', 'ravi@hostel.edu') === 200, 'tech login');
ok((await call('x', 'POST', '/auth/login', { email: 'warden@hostel.edu', password: 'bad' })).status === 401, 'bad password 401');
ok((await call('x', 'GET', '/complaints')).status === 401, 'anon 401');
ok((await call('s', 'GET', '/reports/summary')).status === 403, 'student cannot read reports');

const rahul = (await call('w', 'GET', '/users?role=student&unallocated=true')).data.users.find(u => u.email === 'rahul@student.edu');
const sneha = (await call('w', 'GET', '/users?role=student&unallocated=true')).data.users.find(u => u.email === 'sneha@student.edu');
ok(!!rahul && !!sneha, 'unallocated list');
const beds = (await call('w', 'GET', '/rooms/available-beds')).data.beds;
const bed1 = beds.find(b => b.roomNumber === 'A102' && b.bedLabel === 'A');
const bed2 = beds.find(b => b.roomNumber === 'B201' && b.bedLabel === 'A');
let r = await call('w', 'POST', '/allocations', { studentId: rahul._id, roomId: bed1.roomId, bedLabel: 'A' });
ok(r.status === 201, 'allocate rahul A102-A');
r = await call('w', 'POST', '/allocations', { studentId: sneha._id, roomId: bed1.roomId, bedLabel: 'A' });
ok(r.status === 409, 'duplicate bed rejected: ' + r.data.message);
r = await call('w', 'POST', '/allocations', { studentId: rahul._id, roomId: bed2.roomId, bedLabel: 'A' });
ok(r.status === 409, 'second active allocation rejected: ' + r.data.message);

r = await call('s', 'POST', '/complaints', { category: 'plumbing', title: 'Leaking tap', description: 'Tap leaks all night', locationType: 'room', details: { fixture: 'Tap' } });
ok(r.status === 201 && r.data.complaint.location.roomNumber === 'A102', 'student complaint for room');
const cid = r.data.complaint._id;
ok((await call('t', 'GET', '/complaints/' + cid)).status === 403, 'unassigned tech cannot view');
await login('s2', 'arjun@student.edu');
ok((await call('s2', 'GET', '/complaints/' + cid)).status === 403, 'other student cannot view');

const techs = (await call('w', 'GET', '/users/technicians')).data.technicians;
const ravi = techs.find(t => t.email === 'ravi@hostel.edu');
r = await call('w', 'PATCH', `/complaints/${cid}/assign`, { assignedTo: ravi._id, priority: 'high' });
ok(r.status === 200 && r.data.complaint.status === 'assigned', 'assign');
ok((await call('t', 'PATCH', `/complaints/${cid}/resolve`, { note: 'x fixed' })).status === 409, 'cannot resolve before start');
ok((await call('t', 'PATCH', `/complaints/${cid}/start`)).data.complaint?.status === 'in_progress', 'start');
ok((await call('t', 'POST', `/complaints/${cid}/notes`, { text: 'Ordered washer' })).status === 200, 'note');
ok((await call('t', 'PATCH', `/complaints/${cid}/resolve`, { note: 'Replaced washer' })).data.complaint?.status === 'resolved', 'resolve');
r = await call('s', 'PATCH', `/complaints/${cid}/reopen`, { reason: 'Still dripping' });
ok(r.data.complaint?.status === 'reopened', 'reopen');
r = await call('w', 'PATCH', `/complaints/${cid}/assign`, { assignedTo: ravi._id });
ok(r.data.complaint?.status === 'assigned', 'reassign after reopen');
await call('t', 'PATCH', `/complaints/${cid}/start`); await call('t', 'PATCH', `/complaints/${cid}/resolve`, { note: 'Replaced valve' });
r = await call('s', 'PATCH', `/complaints/${cid}/confirm`);
ok(r.data.complaint?.status === 'closed' && r.data.complaint.statusHistory.length === 9, 'confirm -> closed, history ' + r.data.complaint?.statusHistory.length);

// transfer
r = await call('w', 'POST', '/allocations/transfer', { studentId: rahul._id, roomId: bed2.roomId, bedLabel: 'A' });
ok(r.status === 201 && r.data.allocation.roomId.roomNumber === 'B201', 'transfer');
const after = (await call('w', 'GET', '/rooms/available-beds')).data.beds;
ok(after.some(b => b.roomNumber === 'A102' && b.bedLabel === 'A'), 'old bed is free again');
ok((await call('s', 'GET', '/complaints/' + cid)).data.complaint.location.roomNumber === 'A102', 'complaint keeps original room');
const hist = (await call('s', 'GET', '/allocations/me')).data;
ok(hist.history.length === 2 && hist.current.roomId.roomNumber === 'B201', 'allocation history has 2');
// transfer into occupied bed rejected, original intact
const arjunId = (await call('w', 'GET', '/users?role=student&q=arjun')).data.users[0]._id;
r = await call('w', 'POST', '/allocations/transfer', { studentId: rahul._id, roomId: (await call('w','GET','/rooms')).data.rooms.find(x=>x.roomNumber==='A101')._id, bedLabel: 'A' });
ok(r.status === 409, 'transfer to occupied rejected');
ok((await call('s', 'GET', '/allocations/me')).data.current.roomId.roomNumber === 'B201', 'original allocation intact');
ok((await call('w', 'POST', '/allocations/checkout', { studentId: rahul._id })).status === 200, 'checkout');

for (const p of ['/reports/summary', '/reports/by-category-block', '/reports/resolution-time', '/reports/occupancy']) {
  r = await call('w', 'GET', p); ok(r.status === 200, p + ' ' + JSON.stringify(r.data).slice(0, 160));
}
ok((await call('w', 'GET', '/complaints?status=submitted,reopened&q=corridor')).data.complaints.length === 1, 'filter+search');
ok((await call('w', 'GET', '/nope')).status === 404, 'api 404');

console.log(process.exitCode ? '\nSome checks failed.' : '\nAll checks passed.');
