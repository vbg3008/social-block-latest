import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Comment from "@/app/models/Comment";
import Post from "@/app/models/Post";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /comments/{id}:
 *   patch:
 *     summary: Edit a comment
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
 *       200:
 *         description: Comment updated
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const body = await req.json();

    const comment = await Comment.findById((await params).id);

    if (!comment || comment.isDeleted) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    // Only author or admin can edit
    if (comment.authorId.toString() !== session.userId && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Content cannot be empty" }, { status: 400 });
    }

    comment.content = body.content;
    comment.isEdited = true;
    await comment.save();

    await comment.populate("authorId", "name username avatar isVerified");

    return NextResponse.json({ success: true, data: comment }, { status: 200 });

  } catch (error) {
    console.error("Edit Comment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to edit comment" }, { status: 500 });
  }
}

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Soft delete a comment
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
 *     responses:
 *       200:
 *         description: Comment deleted
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();

    const comment = await Comment.findById((await params).id);

    if (!comment || comment.isDeleted) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    // Only author or admin can delete
    // In some systems, post author can also delete comments on their post
    const post = await Post.findById(comment.postId);
    
    // Check if requester is comment author, post author, or admin
    const canDelete = 
      comment.authorId.toString() === session.userId || 
      (post && post.authorId.toString() === session.userId) || 
      session.role === "admin";

    if (!canDelete) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    comment.isDeleted = true;
    await comment.save();

    // Decrement post comment count
    if (post) {
      await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: -1 } });
    }
    
    // If it was a reply to another comment, decrement parent's replyCount
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } });
    }

    return NextResponse.json({ success: true, message: "Comment deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Delete Comment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete comment" }, { status: 500 });
  }
}
