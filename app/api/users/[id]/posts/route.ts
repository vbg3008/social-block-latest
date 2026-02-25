import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Post from "@/app/models/Post";
import User from "@/app/models/User";
import mongoose from "mongoose";

/**
 * @swagger
 * /users/{id}/posts:
 *   get:
 *     summary: Get posts by a specific user
 *     tags: [Users, Posts]
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
 *         description: User posts retrieved
 *       404:
 *         description: User not found
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    if (!mongoose.isValidObjectId((await params).id)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findById((await params).id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // TODO: Handle privacy checks (e.g. if user isPrivate, check if requester follows them)

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query = {
      authorId: (await params).id,
      isDeleted: false
    };

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
    console.error("Get User Posts Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user posts" }, { status: 500 });
  }
}
