import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Comment from "@/app/models/Comment";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /comments/{id}/reply:
 *   post:
 *     summary: Reply to a comment
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
 *         description: Parent comment ID
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
 *         description: Reply created
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const parentCommentId = (await params).id;
    const body = await req.json();

    if (!mongoose.isValidObjectId(parentCommentId)) {
      return NextResponse.json({ success: false, error: "Invalid comment ID" }, { status: 400 });
    }

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Reply content is required" }, { status: 400 });
    }

    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment || parentComment.isDeleted) {
      return NextResponse.json({ success: false, error: "Parent comment not found" }, { status: 404 });
    }

    // Usually replies only nest 1 level deep (so parentCommentId is the top-level comment)
    // If the parent is already a reply, use its parentCommentId
    const actualParentId = parentComment.parentCommentId || parentComment._id;

    const reply = await Comment.create({
      postId: parentComment.postId,
      authorId: session.userId,
      content: body.content,
      parentCommentId: actualParentId
    });

    // Increment replies count on the parent
    await Comment.findByIdAndUpdate(actualParentId, { $inc: { repliesCount: 1 } });
    
    // Create notification to the person who wrote the comment being replied to
    if (parentComment.authorId.toString() !== session.userId) {
      await Notification.create({
        recipientId: parentComment.authorId,
        actorId: session.userId,
        type: "reply",
        postId: parentComment.postId,
        commentId: reply._id
      });
    }

    await reply.populate("authorId", "name username avatar isVerified");

    return NextResponse.json({ success: true, data: reply }, { status: 201 });

  } catch (error) {
    console.error("Create Reply Error:", error);
    return NextResponse.json({ success: false, error: "Failed to post reply" }, { status: 500 });
  }
}
