import mongoose from "mongoose";

const ActiveUserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    imageUrl: { type: String },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    roomName: { type: String, required: true },
    creatorId: { type: String, required: true, index: true },
    maxMembers: { type: Number, required: true, min: 2, max: 50 },
    activeUsers: { type: [ActiveUserSchema], default: [] },
    /** Set when the room has no connected users; used for auto-delete after timeout */
    lastEmptyAt: { type: Date, default: null },
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Room =
  mongoose.models.Room ?? mongoose.model("Room", RoomSchema);
