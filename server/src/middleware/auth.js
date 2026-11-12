import User from '../models/User.js';
import { asyncHandler, unauthorized, forbidden } from '../utils/http.js';

/** Loads the signed-in user from the session; rejects deactivated or missing accounts. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const userId = req.session?.userId;
  if (!userId) throw unauthorized();
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    await new Promise((resolve) => req.session.destroy(() => resolve()));
    throw unauthorized('Your session has ended. Please sign in again.');
  }
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(forbidden());
  next();
};
