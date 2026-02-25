import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  status: "pending" | "accepted";
  createdAt: Date;
  updatedAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    followingId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted"], 
      default: "accepted" 
    },
  },
  { timestamps: true }
);

// Prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// For getting a user's followers list
FollowSchema.index({ followingId: 1, status: 1 });

// For getting the users someone is following
FollowSchema.index({ followerId: 1, status: 1 });

const Follow: Model<IFollow> =
  mongoose.models.Follow || mongoose.model<IFollow>("Follow", FollowSchema);

export default Follow;
