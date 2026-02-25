import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  content: string;
  media: Array<{
    url: string;
    type: "image" | "video";
    publicId?: string; // For things like Cloudinary
  }>;
  hashtags: string[];
  visibility: "public" | "followers-only" | "private";
  isDeleted: boolean; // Soft delete
  
  // Denormalized engagement fields for performance
  likesCount: number;
  commentsCount: number;
  repostsCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    authorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    content: { type: String, maxLength: 2200 }, // Instagram style limit
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
        publicId: { type: String }
      }
    ],
    // Only embed tags instead of separate collection for performance (avoids JOINs)
    hashtags: { type: [String], index: true }, 
    
    visibility: { 
      type: String, 
      enum: ["public", "followers-only", "private"], 
      default: "public",
      index: true 
    },
    isDeleted: { type: Boolean, default: false, index: true },
    
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
// For chronological user feeds
PostSchema.index({ authorId: 1, createdAt: -1 });

// For chronological global feeds (excluding deleted/private)
PostSchema.index({ isDeleted: 1, visibility: 1, createdAt: -1 });

// For hashtag searches
PostSchema.index({ hashtags: 1, createdAt: -1 });

// Text search if needed later
PostSchema.index({ content: 'text' });

const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
