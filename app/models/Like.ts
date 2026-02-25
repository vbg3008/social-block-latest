import mongoose, { Document, Model, Schema } from "mongoose";

// Polymorphic Like handling both Posts and Comments
export interface ILike extends Document {
  userId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: "Post" | "Comment";
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    targetId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      index: true
    },
    targetType: { 
      type: String, 
      enum: ["Post", "Comment"], 
      required: true 
    }
  },
  // We only need createdAt, updatedAt is not necessary for a simple like
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent user from liking the same thing multiple times
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

// For getting the users who liked a post/comment
LikeSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });

const Like: Model<ILike> =
  mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);

export default Like;
