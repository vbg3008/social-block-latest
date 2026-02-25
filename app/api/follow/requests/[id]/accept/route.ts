import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Follow from "@/app/models/Follow";
import User from "@/app/models/User";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /follow/requests/{id}/accept:
 *   post:
 *     summary: Accept a follow request
 *     tags: [Follow System]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Follower user ID
 *     responses:
 *       200:
 *         description: Request accepted
 *       404:
 *         description: Request not found
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    
    // The `:id` here is the *follower's* user ID
    const followerId = (await params).id;
    const followingId = session.userId;

    if (!mongoose.isValidObjectId(followerId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const followReq = await Follow.findOne({
      followerId,
      followingId,
      status: "pending"
    });

    if (!followReq) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    // Accept it
    followReq.status = "accepted";
    await followReq.save();

    // Increment counts
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });

    return NextResponse.json({ success: true, message: "Follow request accepted" }, { status: 200 });

  } catch (error) {
    console.error("Accept Follow Error:", error);
    return NextResponse.json({ success: false, error: "Failed to accept request" }, { status: 500 });
  }
}
