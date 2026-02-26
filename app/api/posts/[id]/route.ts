import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Post from "@/app/models/Post";
import Like from "@/app/models/Like";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved
 *       404:
 *         description: Post not found
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getAuthSession(req);
    
    if (!mongoose.isValidObjectId((await params).id)) {
      return NextResponse.json({ success: false, error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findOne({ _id: (await params).id, isDeleted: false })
      .populate("authorId", "name username avatar isVerified isPrivate")
      .lean();

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    let isLiked = false;
    if (session) {
      const like = await Like.findOne({
        userId: session.userId,
        targetId: post._id,
        targetType: "Post"
      });
      if (like) isLiked = true;
    }

    const postData = { ...post, isLiked };

    return NextResponse.json({ success: true, data: postData }, { status: 200 });

  } catch (error) {
    console.error("Get Post Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch post" }, { status: 500 });
  }
}

/**
 * @swagger
 * /posts/{id}:
 *   patch:
 *     summary: Edit a post
 *     tags: [Posts]
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
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               visibility:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated
 *       403:
 *         description: Forbidden
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const body = await req.json();

    const post = await Post.findById((await params).id);

    if (!post || post.isDeleted) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Only author or admin can edit
    if (post.authorId.toString() !== session.userId && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const allowedUpdates = ["content", "hashtags", "visibility", "media"];
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        (post as any)[key] = body[key];
      }
    }

    await post.save();
    await post.populate("authorId", "name username avatar isVerified");

    return NextResponse.json({ success: true, data: post }, { status: 200 });

  } catch (error) {
    console.error("Edit Post Error:", error);
    return NextResponse.json({ success: false, error: "Failed to edit post" }, { status: 500 });
  }
}

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Soft delete a post
 *     tags: [Posts]
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
 *         description: Post deleted
 *       403:
 *         description: Forbidden
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();

    const post = await Post.findById((await params).id);

    if (!post || post.isDeleted) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Only author or admin can delete
    if (post.authorId.toString() !== session.userId && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    post.isDeleted = true;
    await post.save();

    return NextResponse.json({ success: true, message: "Post deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Delete Post Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 });
  }
}
