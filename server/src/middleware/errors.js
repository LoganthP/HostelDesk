import { HttpError } from '../utils/http.js';

export function apiNotFound(req, res) {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
}

function duplicateMessage(err) {
  const keys = Object.keys(err.keyPattern || err.keyValue || {});
  if (keys.includes('email')) return 'An account with this email already exists.';
  if (keys.includes('bedLabel')) return 'That bed is already occupied.';
  if (keys.includes('studentId')) return 'This student already has an active room. Use Transfer instead.';
  if (keys.includes('roomNumber')) return 'A room with this number already exists in that block.';
  return 'That record already exists.';
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(' ');
    return res.status(400).json({ message: message || 'Some fields are invalid.' });
  }
  if (err?.name === 'CastError') return res.status(400).json({ message: `Invalid value for ${err.path}.` });
  if (err?.name === 'VersionError') {
    return res.status(409).json({ message: 'Someone else updated this record just now. Refresh and try again.' });
  }
  if (err?.code === 11000) return res.status(409).json({ message: duplicateMessage(err) });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request body is not valid JSON.' });

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
}
