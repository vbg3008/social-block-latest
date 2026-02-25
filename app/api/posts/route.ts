import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Post from "@/app/models/Post";
import Follow from "@/app/models/Follow";
import mongoose from "mongoose";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get post feed
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Feed type (global or following)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Auth is optional for global feed, required for following feed
    const session = await getAuthSession(req);
    
    const { searchParams } = new URL(req.url);
    const feedType = searchParams.get("type") || "global"; // 'global' or 'following'
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    let query: any = { isDeleted: false };

    if (feedType === "following") {
      if (!session) return unauthorizedResponse("Please login to view your feed");

      // 1. Get list of users the current user follows
      const follows = await Follow.find({ 
        followerId: session.userId,
        status: "accepted" 
      }).select("followingId");
      
      const followingIds = follows.map(f => f.followingId);
      
      // Include current user's own posts
      followingIds.push(new mongoose.Types.ObjectId(session.userId));

      // 2. Query posts from those users
      query = {
        ...query,
        authorId: { $in: followingIds }
      };
    } else {
      // Global feed - only show public posts
      query.visibility = "public";
    }

    // Execute query with pagination and populate author details
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name username avatar isVerified")
      .lean();

    const total = await Post.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               visibility:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const body = await req.json();

    const { content, media, hashtags, visibility } = body;

    // Validation
    if (!content && (!media || media.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Post must contain content or media" },
        { status: 400 }
      );
    }

    // Create the post
    const post = await Post.create({
      authorId: session.userId,
      content,
      media: media || [],
      hashtags: hashtags || [],
      visibility: visibility || "public"
    });

    await post.populate("authorId", "name username avatar isVerified");

    return NextResponse.json({ success: true, data: post }, { status: 201 });

  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
