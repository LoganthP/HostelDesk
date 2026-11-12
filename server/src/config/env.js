import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const missing = ['MONGODB_URI', 'SESSION_SECRET'].filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(`\n✖ Missing environment variable(s): ${missing.join(', ')}`);
  console.error('  Copy server/.env.example to server/.env and fill in the values.\n');
  process.exit(1);
}

export const env = {
  mongoUri: process.env.MONGODB_URI.trim(),
  dbName: process.env.DB_NAME?.trim() || 'hostel_cms',
  sessionSecret: process.env.SESSION_SECRET.trim(),
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || '',
};

export const isProd = env.nodeEnv === 'production';
