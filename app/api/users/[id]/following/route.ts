import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Follow from "@/app/models/Follow";
import mongoose from "mongoose";

/**
 * @swagger
 * /users/{id}/following:
 *   get:
 *     summary: Get accounts followed by a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Following list retrieved
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    if (!mongoose.isValidObjectId((await params).id)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Users the target user is following (target user is followerId)
    const following = await Follow.find({
      followerId: (await params).id,
      status: "accepted"
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("followingId", "name username avatar isVerified bio")
    .lean();

    const total = await Follow.countDocuments({ followerId: (await params).id, status: "accepted" });

    return NextResponse.json({
      success: true,
      data: following.map(f => f.followingId), // Extract just the user object
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Following Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch following" }, { status: 500 });
  }
}
