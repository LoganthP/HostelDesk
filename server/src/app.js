import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env, isProd } from './config/env.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roomRoutes from './routes/rooms.js';
import allocationRoutes from './routes/allocations.js';
import complaintRoutes from './routes/complaints.js';
import reportRoutes from './routes/reports.js';
import { apiNotFound, errorHandler } from './middleware/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEVEN_DAYS = 7 * 24 * 60 * 60;

/** Call after MongoDB is connected — sessions are stored in the same database. */
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (isProd || env.cookieSecure) app.set('trust proxy', 1);

  if (env.clientOrigin) {
    app.use(cors({ origin: env.clientOrigin.split(',').map((o) => o.trim()), credentials: true }));
  }
  app.use(express.json({ limit: '1mb' }));
  if (!isProd) app.use(morgan('dev'));

  app.use(
    session({
      name: 'hcms.sid',
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        dbName: env.dbName,
        collectionName: 'sessions',
        ttl: SEVEN_DAYS,
      }),
      cookie: { httpOnly: true, sameSite: 'lax', secure: env.cookieSecure, maxAge: SEVEN_DAYS * 1000 },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/allocations', allocationRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api', apiNotFound);

  // After `npm run build` in /client, the API also serves the React app from the same origin.
  const dist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
