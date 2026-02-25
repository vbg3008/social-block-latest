import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  
  // Profile
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  location?: string;
  
  // Settings
  isPrivate: boolean;
  isVerified: boolean;
  role: "user" | "admin" | "moderator";
  
  // Denormalized counts
  followersCount: number;
  followingCount: number;
  
  // Auth / Security
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  accountStatus: "active" | "suspended" | "banned";
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true,
      index: true
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: { type: String, required: true },
    
    bio: { type: String, maxLength: 500 },
    avatar: { type: String },
    coverImage: { type: String },
    website: { type: String },
    location: { type: String },
    
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
    
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    accountStatus: { 
      type: String, 
      enum: ["active", "suspended", "banned"], 
      default: "active" 
    },
  },
  { timestamps: true }
);

// Indexes for common queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ accountStatus: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;