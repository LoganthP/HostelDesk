# Reusable QA prompt

Paste the prompt below into a new chat with Claude (or any coding assistant that can run code), together with the project zip.

---

You are reviewing **HostelDesk**, a Hostel Complaint Management System (React + Vite + TypeScript client in `client/`, Express + Mongoose API in `server/`, MongoDB Atlas). Your job is to test every button, trigger and connection, and to fix anything broken **without changing the core design or main functionality**.

**Hard rules**
- Do not change the data model, collection names, API routes, request/response shapes, the complaint status flow (Submitted → Assigned → In progress → Resolved → Closed, plus Reopened), the role permissions, or the visual design system.
- Only fix defects: crashes, buttons that do nothing, wrong redirects, broken client–server calls, missing error/loading states, wrong labels, wrong counts.
- Keep each fix as small as possible and explain it in one line.
- If something is a design choice rather than a bug, report it instead of changing it.

**Setup**
1. Run MongoDB (Atlas, or a local `mongod --replSet rs0` initiated as a replica set so transactions work).
2. `npm run install:all`, create `server/.env` from `.env.example`, `npm run seed`, `npm run dev`.
3. Confirm `GET http://localhost:5000/api/health` returns `{"ok":true,"database":"connected"}` and that requests from `http://localhost:5173/api/...` reach the API through the Vite proxy with the login cookie.
4. Run `npm run test:api --prefix server` on a freshly seeded database. Every line must say PASS.

**Then check each item and report PASS/FAIL**
- *Auth:* every demo-account button fills the right email; sign in, wrong password message, register a student, sign out returns to `/login` and the next sign-in lands on that user's own overview; an expired session returns to login.
- *Student:* overview counts; My room (room, roommates, history); Report an issue for **My room** (prefilled) and **Shared area** (block, floor, quick-pick chips), category-specific fields; complaint list tabs, search and filters; Confirm repair; Reopen with a reason; cannot open another student's complaint (403 message) or warden pages (redirect).
- *Warden:* overview tiles; Complaints tabs (Needs assignment etc.), search, category, priority and block filters; complaint page: matching specialist preselected, missing-specialty hint when none, priority buttons, Assign / Reassign / Update priority, Add note, Close complaint; Rooms: block tabs, Add room, Edit room (add/remove beds, refusing removal of an occupied bed), Delete room (refused when occupied or with history), click a free bed to allocate, click an occupied bed for Transfer / Room history / Check out; Students: tabs, search, Allocate, Transfer, Check out, History, Deactivate / Reactivate, Add student; Staff: Add staff with specialization, Deactivate / Reactivate, open-job counts; Reports: all three charts and tables.
- *Maintenance:* overview shows Up next; Start work from the overview and from the job page; Add note; Mark as resolved requires a repair note; cannot open jobs assigned to someone else.
- *End-to-end Wi-Fi demo:* student submits a Wi-Fi complaint → warden assigns IT support (`it@hostel.edu`) → technician starts, adds a note, resolves → student reopens → warden reassigns → technician resolves → student confirms → history shows 9 entries with names, roles and times.
- *Integrity:* allocating an occupied bed and giving a student a second room both fail with a clear message; a failed transfer leaves the original bed; after a transfer the old bed is free and earlier complaints still show the old room.
- *UI states:* no blank screens while loading, counts hidden until data arrives, toasts on every success and error, modals close with Esc and the backdrop, layout works at 390 px wide, no errors in the browser console other than the expected 401 from `/api/auth/me` before sign-in.

**Deliver**
A table of every check with PASS/FAIL, a list of fixes with file and one-line reason, and the updated project as a zip.
