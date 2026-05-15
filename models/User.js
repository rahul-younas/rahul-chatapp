import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    imageUrl: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User =
  mongoose.models.User ?? mongoose.model("User", UserSchema);
