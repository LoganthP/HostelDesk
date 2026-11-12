export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (m) => new HttpError(400, m);
export const unauthorized = (m = 'Please sign in to continue.') => new HttpError(401, m);
export const forbidden = (m = 'You do not have permission to do that.') => new HttpError(403, m);
export const notFound = (m = 'Not found.') => new HttpError(404, m);
export const conflict = (m) => new HttpError(409, m);

/** Forward async errors to the Express error handler (Express 4 does not do this by itself). */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const isValidId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

export function requireId(id, label = 'id') {
  if (!isValidId(id)) throw badRequest(`Invalid ${label}.`);
  return id;
}

/** Trimmed string or '' — safe for untrusted input. */
export const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : typeof v === 'number' ? String(v) : '');

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const idOf = (v) => (v && typeof v === 'object' && v._id ? v._id : v);
export const sameId = (a, b) => Boolean(a && b) && String(idOf(a)) === String(idOf(b));
