import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId; // Who triggered it
  type: "follow" | "like" | "comment" | "reply" | "mention";
  
  // References for contextual link (e.g. what post was liked)
  postId?: mongoose.Types.ObjectId;
  commentId?: mongoose.Types.ObjectId;
  
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    actorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["follow", "like", "comment", "reply", "mention"], 
      required: true 
    },
    postId: { 
      type: Schema.Types.ObjectId, 
      ref: "Post" 
    },
    commentId: { 
      type: Schema.Types.ObjectId, 
      ref: "Comment" 
    },
    isRead: { 
      type: Boolean, 
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// Index for fetching a user's notification feed (most recent first)
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Index for unread notifications count
NotificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
