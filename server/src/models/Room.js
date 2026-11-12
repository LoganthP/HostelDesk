import mongoose from 'mongoose';

// Beds are embedded: a room and its beds are almost always read together.
const bedSchema = new mongoose.Schema(
  { label: { type: String, required: true, trim: true, uppercase: true, maxlength: 5 } },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    block: { type: String, required: [true, 'Block is required.'], trim: true, uppercase: true, maxlength: 20 },
    floor: { type: Number, required: [true, 'Floor is required.'], min: 0, max: 100 },
    roomNumber: { type: String, required: [true, 'Room number is required.'], trim: true, uppercase: true, maxlength: 20 },
    beds: {
      type: [bedSchema],
      validate: {
        validator: (beds) => beds.length >= 1 && beds.length <= 12 && new Set(beds.map((b) => b.label)).size === beds.length,
        message: 'A room needs 1–12 beds, each with a unique label.',
      },
    },
  },
  { timestamps: true },
);

roomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model('Room', roomSchema);
