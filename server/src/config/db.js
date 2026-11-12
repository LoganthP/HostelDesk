import mongoose from 'mongoose';
import { env } from './env.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Allocation from '../models/Allocation.js';
import Complaint from '../models/Complaint.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { dbName: env.dbName, serverSelectionTimeoutMS: 15000 });
  console.log(`✔ MongoDB connected (database "${env.dbName}")`);
  return mongoose.connection;
}

/** Make sure every index (including the partial unique allocation indexes) exists before serving requests. */
export async function ensureIndexes() {
  for (const model of [User, Room, Allocation, Complaint]) {
    try {
      await model.createIndexes();
    } catch (err) {
      console.warn(`⚠ Could not build indexes for ${model.modelName}: ${err.message}`);
    }
  }
}
