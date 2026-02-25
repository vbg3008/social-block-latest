import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Follow from "@/app/models/Follow";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /follow/requests/{id}/reject:
 *   post:
 *     summary: Reject a follow request
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
 *         description: Request rejected
 *       404:
 *         description: Request not found
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    
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

    // Delete it 
    await Follow.findByIdAndDelete(followReq._id);

    return NextResponse.json({ success: true, message: "Follow request rejected" }, { status: 200 });

  } catch (error) {
    console.error("Reject Follow Error:", error);
    return NextResponse.json({ success: false, error: "Failed to reject request" }, { status: 500 });
  }
}
