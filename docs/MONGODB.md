# How HostelDesk uses MongoDB

MongoDB Atlas is the only datastore. The browser never talks to MongoDB directly. Every request goes **React → Express API (`/api/...`) → Mongoose → MongoDB Atlas**, and Express decides what each role is allowed to read or write.

Line numbers below refer to the files in `server/src/` as shipped.

## 1. Connection

| What | Where |
|---|---|
| Connection string and database name are read from `server/.env` (`MONGODB_URI`, `DB_NAME`); the server refuses to start without them. | `config/env.js` |
| `mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 })` | `config/db.js:10` |
| On startup every model's indexes are built with `createIndexes()` before the API accepts requests. | `config/db.js:19`, called from `server.js` |
| `/api/health` reports whether the Mongo connection is up. | `app.js:52` |

## 2. Collections and schema design

| Collection | Model | Design decision |
|---|---|---|
| `users` | `models/User.js` | One collection for students, wardens and maintenance staff, separated by `role`. `email` is unique (`:11`). `passwordHash` has `select: false` (`:16`) so it is never returned unless a query asks for it (only login does). |
| `rooms` | `models/Room.js` | **Beds are embedded** in the room document because a room and its beds are always read together. Unique compound index on `(block, roomNumber)` (`:25`). |
| `allocations` | `models/Allocation.js` | Kept in **its own collection** so a student's full room history is preserved. Ending an allocation sets `status: 'ended'`, `endDate`, `endReason`; nothing is deleted. |
| `complaints` | `models/Complaint.js` | `location` is an embedded **snapshot** (`:45`), so a complaint still points at the room it was reported from after the student moves. `statusHistory` (`:55`) and repair `notes` are embedded arrays, because the detail page always shows them with the complaint. `details` is a schemaless `Mixed` object (`:50`) for category-specific fields (fixture for plumbing, network/access point for Wi-Fi). |
| `sessions` | connect-mongo | Login sessions live in MongoDB too (`app.js:41`), reusing Mongoose's client. They expire after 7 days. |

This is the main NoSQL argument for the project: complaint details vary by category, history belongs to its complaint, and the room snapshot must not change later. A document model fits all three without join tables.

## 3. Integrity rules enforced by the database

| Rule | How | Where |
|---|---|---|
| A student can have only one active room | Partial unique index on `studentId` where `status: 'active'` | `models/Allocation.js:23` |
| A bed can hold only one active student | Partial unique index on `(roomId, bedLabel)` where `status: 'active'` | `models/Allocation.js:27` |
| No duplicate rooms or emails | Unique indexes | `Room.js:25`, `User.js:11` |
| Two people editing the same complaint can't overwrite each other | `optimisticConcurrency: true` (version check on save) | `models/Complaint.js:61` |

Because they are partial indexes, ended allocations don't count, so history can hold any number of past allocations for the same bed. Duplicate-key errors (code `11000`) are translated into readable 409 messages in `middleware/errors.js`.

## 4. Transactions

A transfer must end the old allocation **and** create the new one, or do neither.

- `utils/transaction.js:13–16` opens a session and runs the work in `session.withTransaction(...)`.
- `routes/allocations.js:101–130` is the transfer: it ends the current allocation (`:111`) and creates the new one (`:118`) inside the same session. If the new bed is taken, the whole transaction rolls back and the student keeps their original bed.
- Atlas clusters are replica sets, so this always runs as a real transaction there. On a local standalone `mongod` (no transactions), `runInTransaction` falls back and the route undoes the first step by hand (`:125`).

## 5. Everyday queries

| Feature | Query | Where |
|---|---|---|
| Role-scoped complaint lists | `scopeFor(user)` adds `{ studentId }` for students, `{ assignedTo }` for technicians, nothing for wardens | `routes/complaints.js:16` |
| Filters | `status: { $in: [...] }`, `category`, `priority`, `'location.block'` (query on an embedded field, `:32`) and case-insensitive regex search with escaped input (`:39`) | `routes/complaints.js` |
| Names instead of IDs | `populate()` for student, technician and room references | `routes/complaints.js:46`, `routes/allocations.js:36` |
| Room grid with occupants | Rooms + active allocations, joined in the API; numeric collation so A2 sorts before A10 | `routes/rooms.js:14` |
| Block list | `Room.distinct('block')` | `routes/rooms.js:49` |
| Guard checks | `Allocation.exists(...)` before allocating, deleting rooms or deactivating students | `routes/allocations.js:80`, `routes/rooms.js:127` |
| Technician workload | Aggregation counting open jobs per technician | `routes/users.js:56` |
| Status changes | `transition()` pushes `{from, to, action, note, by, byName, byRole, at}` into `statusHistory`, then saves | `services/complaintWorkflow.js:10` |

## 6. Aggregation pipelines (the Reports page)

| Report | Pipeline | Where |
|---|---|---|
| Complaints by category and block | `$group` on `{ block: '$location.block', category }` with total and open counts → `$project` → `$sort` | `routes/reports.js:46` |
| Average resolution time | `$match resolvedAt ≠ null` → `$project` hours = `(resolvedAt − createdAt) / 3,600,000` → `$group` avg/min/max/count per category → `$round` | `routes/reports.js:65` |
| Occupancy by block | `$project` bed count with `$size` → `$lookup` (pipeline form) into `allocations` for active ones → `$group` by block → occupancy % | `routes/reports.js:97` |
| Dashboard summary | `$group` by status, `$sum` of `$size: '$beds'`, `countDocuments` | `routes/reports.js:13` |

You can paste any of these pipelines into **MongoDB Compass → Aggregations** to run them against your Atlas data.

## 7. See it yourself in Compass

1. Connect Compass with the same `MONGODB_URI`.
2. Open `hostel_cms.allocations` → *Indexes* to see the two partial unique indexes.
3. Transfer a student in the app, then filter `allocations` by that `studentId`: one `ended` document with `endReason: "transfer"` and one `active` document.
4. Open a complaint document to see the embedded `location` snapshot, `statusHistory` and `notes`.
