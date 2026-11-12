import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const allocationSchema = new mongoose.Schema(
  {
    studentId: { type: ObjectId, ref: 'User', required: true },
    roomId: { type: ObjectId, ref: 'Room', required: true },
    bedLabel: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    endReason: { type: String, enum: ['transfer', 'checkout'] },
    createdBy: { type: ObjectId, ref: 'User' },
    endedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// The database itself guarantees: one active allocation per student, and one active allocation per bed.
allocationSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' }, name: 'one_active_allocation_per_student' },
);
allocationSchema.index(
  { roomId: 1, bedLabel: 1 },
  { unique: true, partialFilterExpression: { status: 'active' }, name: 'one_active_allocation_per_bed' },
);
allocationSchema.index({ studentId: 1, startDate: -1 });

export default mongoose.model('Allocation', allocationSchema);
