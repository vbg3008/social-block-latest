import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Comment from "@/app/models/Comment";
import Post from "@/app/models/Post";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /posts/{id}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comments retrieved
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const postId = (await params).id;

    if (!mongoose.isValidObjectId(postId)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 });
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // By default fetch top-level comments
    const comments = await Comment.find({ 
      postId, 
      parentCommentId: null,
      isDeleted: false 
    })
      .sort({ createdAt: -1 }) // or 1 for chronological
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name username avatar isVerified")
      .lean();

    const total = await Comment.countDocuments({ 
      postId, 
      parentCommentId: null,
      isDeleted: false 
    });

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Comments Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 });
  }
}

/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const postId = (await params).id;
    const body = await req.json();

    if (!mongoose.isValidObjectId(postId)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 });
    }

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const comment = await Comment.create({
      postId,
      authorId: session.userId,
      content: body.content
    });

    // Increment post comment count
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Create notification if not commenting on own post
    if (post.authorId.toString() !== session.userId) {
      await Notification.create({
        recipientId: post.authorId,
        actorId: session.userId,
        type: "comment",
        postId: post._id,
        commentId: comment._id
      });
    }

    await comment.populate("authorId", "name username avatar isVerified");

    return NextResponse.json({ success: true, data: comment }, { status: 201 });

  } catch (error) {
    console.error("Create Comment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 });
  }
}
