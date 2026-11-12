import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB, ensureIndexes } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`\n✖ Could not connect to MongoDB: ${err.message}`);
    console.error('  • Check MONGODB_URI (user name, password, cluster host) in server/.env');
    console.error('  • In Atlas → Network Access, add your current IP address');
    console.error('  • Special characters in the password must be URL-encoded (e.g. @ → %40)\n');
    process.exit(1);
  }
  await ensureIndexes();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`✔ API ready on http://localhost:${env.port}  (health check: /api/health)`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`✖ Port ${env.port} is already in use. Change PORT in server/.env or stop the other process.`);
    else console.error(err);
    process.exit(1);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
