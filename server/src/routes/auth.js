import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, badRequest, unauthorized, str } from '../utils/http.js';

const router = Router();

function startSession(req, user) {
  return new Promise((resolve, reject) => {
    // A fresh session id on every sign-in prevents session fixation.
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = String(user._id);
      req.session.role = user.role;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

// Students can create their own account. Wardens create staff accounts from the dashboard.
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, rollNumber, phone } = req.body || {};
    if (typeof password !== 'string' || password.length < 6) throw badRequest('Password must be at least 6 characters.');
    const user = await User.create({
      name: str(name, 80),
      email: str(email, 120),
      rollNumber: str(rollNumber, 30) || undefined,
      phone: str(phone, 20) || undefined,
      role: 'student',
      passwordHash: await User.hashPassword(password),
    });
    await startSession(req, user);
    res.status(201).json({ user });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = str(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) throw badRequest('Enter your email and password.');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.verifyPassword(password))) throw unauthorized('Email or password is incorrect.');
    if (!user.isActive) throw unauthorized('This account has been deactivated. Contact the hostel office.');
    await startSession(req, user);
    res.json({ user });
  }),
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('hcms.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.patch(
  '/me/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) throw badRequest('New password must be at least 6 characters.');
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.verifyPassword(String(currentPassword || '')))) throw badRequest('Current password is incorrect.');
    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();
    res.json({ ok: true });
  }),
);

export default router;
