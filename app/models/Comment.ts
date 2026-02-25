import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  
  // For nested replies (null if top-level comment)
  parentCommentId?: mongoose.Types.ObjectId;
  
  isEdited: boolean;
  isDeleted: boolean; // Soft delete for moderation
  
  // Denormalized counts
  likesCount: number;
  repliesCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { 
      type: Schema.Types.ObjectId, 
      ref: "Post", 
      required: true,
      index: true
    },
    authorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    content: { type: String, required: true, maxLength: 500 },
    
    parentCommentId: { 
      type: Schema.Types.ObjectId, 
      ref: "Comment",
      default: null,
      index: true
    },
    
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
// For loading comments on a post (chronological or reverse)
CommentSchema.index({ postId: 1, parentCommentId: 1, createdAt: 1 });

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
