import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Post from "@/app/models/Post";
import Like from "@/app/models/Like";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Post liked
 *       400:
 *         description: Already liked
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const postId = (await params).id;
    const userId = session.userId;

    if (!mongoose.isValidObjectId(postId)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId,
      targetId: postId,
      targetType: "Post"
    });

    if (existingLike) {
      return NextResponse.json({ success: false, error: "Already liked" }, { status: 400 });
    }

    // Create like
    await Like.create({
      userId,
      targetId: postId,
      targetType: "Post"
    });

    // Increment post like count
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

    // Create notification if not liking own post
    if (post.authorId.toString() !== userId) {
      await Notification.create({
        recipientId: post.authorId,
        actorId: userId,
        type: "like",
        postId: post._id
      });
    }

    return NextResponse.json({ success: true, message: "Post liked" }, { status: 201 });

  } catch (error) {
    console.error("Like Error:", error);
    return NextResponse.json({ success: false, error: "Failed to like post" }, { status: 500 });
  }
}

/**
 * @swagger
 * /posts/{id}/like:
 *   delete:
 *     summary: Remove a like from a post
 *     tags: [Likes]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post unliked
 *       400:
 *         description: Not liked yet
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const postId = (await params).id;
    const userId = session.userId;

    if (!mongoose.isValidObjectId(postId)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 });
    }

    const like = await Like.findOneAndDelete({
      userId,
      targetId: postId,
      targetType: "Post"
    });

    if (!like) {
      return NextResponse.json({ success: false, error: "Not liked yet" }, { status: 400 });
    }

    // Decrement post like count
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
    
    // Optionally remove the notification
    const post = await Post.findById(postId);
    if (post && post.authorId.toString() !== userId) {
        await Notification.findOneAndDelete({
            recipientId: post.authorId,
            actorId: userId,
            type: "like",
            postId: post._id
        });
    }

    return NextResponse.json({ success: true, message: "Post unliked" }, { status: 200 });

  } catch (error) {
    console.error("Unlike Error:", error);
    return NextResponse.json({ success: false, error: "Failed to unlike post" }, { status: 500 });
  }
}
