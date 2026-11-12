import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, STATUSES, ROLES } from '../constants.js';

const { ObjectId, Mixed } = mongoose.Schema.Types;

// Location is stored as reported, so the complaint keeps pointing at the right place after a student moves.
const locationSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['room', 'shared'], required: true },
    roomId: { type: ObjectId, ref: 'Room' },
    block: { type: String, required: true, trim: true, uppercase: true },
    floor: { type: Number, min: 0, max: 100 },
    roomNumber: { type: String, trim: true },
    bedLabel: { type: String, trim: true },
    area: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false },
);

const historySchema = new mongoose.Schema(
  {
    from: { type: String, enum: [...STATUSES, null], default: null },
    to: { type: String, enum: STATUSES, required: true },
    action: { type: String, required: true },
    note: { type: String, maxlength: 1000 },
    by: { type: ObjectId, ref: 'User' },
    byName: String,
    byRole: { type: String, enum: ROLES },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  by: { type: ObjectId, ref: 'User' },
  byName: String,
  byRole: { type: String, enum: ROLES },
  at: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema(
  {
    studentId: { type: ObjectId, ref: 'User', required: true },
    location: { type: locationSchema, required: true },
    category: { type: String, enum: CATEGORIES, required: [true, 'Category is required.'] },
    title: { type: String, required: [true, 'Title is required.'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required.'], trim: true, maxlength: 2000 },
    // Category-specific extras (e.g. fixture for plumbing, access point for Wi-Fi).
    details: { type: Mixed, default: {} },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'submitted' },
    assignedTo: { type: ObjectId, ref: 'User', default: null },
    assignedAt: Date,
    statusHistory: { type: [historySchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    reopenCount: { type: Number, default: 0 },
  },
  { timestamps: true, optimisticConcurrency: true, minimize: false },
);

complaintSchema.pre('validate', function validateLocation(next) {
  const loc = this.location;
  if (loc?.kind === 'room' && (!loc.roomId || !loc.roomNumber)) this.invalidate('location', 'Room location needs a room.');
  if (loc?.kind === 'shared' && !loc.area) this.invalidate('location', 'Describe the shared area.');
  next();
});

complaintSchema.index({ studentId: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ 'location.block': 1, category: 1 });

export default mongoose.model('Complaint', complaintSchema);
