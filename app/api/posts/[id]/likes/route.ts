import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Like from "@/app/models/Like";
import mongoose from "mongoose";

/**
 * @swagger
 * /posts/{id}/likes:
 *   get:
 *     summary: Get list of users who liked a post
 *     tags: [Likes]
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
 *         description: List of users retrieved
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

    const likes = await Like.find({ targetId: postId, targetType: "Post" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name username avatar isVerified")
      .lean();

    const total = await Like.countDocuments({ targetId: postId, targetType: "Post" });

    return NextResponse.json({
      success: true,
      data: likes.map(like => like.userId),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Likes Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch likes" }, { status: 500 });
  }
}
