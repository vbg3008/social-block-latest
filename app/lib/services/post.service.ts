import mongoose from "mongoose";
import Post from "@/app/models/Post";
import Follow from "@/app/models/Follow";
import { connectDB } from "@/app/lib/mongo";
import { CreatePostDTO, GetPostsQueryDTO } from "../validations/post.schema";
import { NotFoundError, UnauthorizedError } from "../errors";

export class PostService {
  /**
   * Fetch posts with optional feed type (global/following)
   */
  static async getFeed(queryDTO: GetPostsQueryDTO, userId?: string) {
    await connectDB();
    
    const { type: feedType, page, limit } = queryDTO;
    const skip = (page - 1) * limit;

    let query: any = { isDeleted: false };

    if (feedType === "following") {
      if (!userId) throw new UnauthorizedError("Please login to view your feed");

      // 1. Get list of users the current user follows
      const follows = await Follow.find({ 
        followerId: userId,
        status: "accepted" 
      }).select("followingId");
      
      const followingIds = follows.map(f => f.followingId);
      
      // Include current user's own posts
      followingIds.push(new mongoose.Types.ObjectId(userId));

      // 2. Query posts from those users
      query = {
        ...query,
        authorId: { $in: followingIds }
      };
    } else {
      // Global feed
      if (userId) {
        // Show public posts OR the user's own posts
        query.$or = [
          { visibility: "public" },
          { authorId: new mongoose.Types.ObjectId(userId) }
        ];
      } else {
        // Only show public posts if not logged in
        query.visibility = "public";
      }
    }

    // Execute query with pagination and populate author details
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name username avatar isVerified")
      .lean();

    const total = await Post.countDocuments(query);

    return {
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new post
   */
  static async createPost(dto: CreatePostDTO, userId: string) {
    await connectDB();

    const post = await Post.create({
      authorId: new mongoose.Types.ObjectId(userId),
      content: dto.content,
      media: dto.media || [],
      hashtags: dto.hashtags || [],
      visibility: dto.visibility || "public"
    });

    await post.populate("authorId", "name username avatar isVerified");
    return post;
  }
}
