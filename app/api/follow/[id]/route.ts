import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import Follow from "@/app/models/Follow";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /follow/{id}:
 *   post:
 *     summary: Follow a user
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
 *     responses:
 *       201:
 *         description: Followed or follow request sent
 *       400:
 *         description: Cannot follow invalid Target or Self
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const followerId = session.userId;
    const followingId = (await params).id;

    if (!mongoose.isValidObjectId(followingId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ success: false, error: "You cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check existing follow
    const existingFollow = await Follow.findOne({ followerId, followingId });
    if (existingFollow) {
      return NextResponse.json({ 
        success: false, 
        error: `Already ${existingFollow.status === "pending" ? "requested to follow" : "following"}` 
      }, { status: 400 });
    }

    const status = targetUser.isPrivate ? "pending" : "accepted";

    // Create follow relationship
    await Follow.create({
      followerId,
      followingId,
      status
    });

    if (status === "accepted") {
      // Increment counts
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    }

    // Create Notification
    await Notification.create({
      recipientId: followingId,
      actorId: followerId,
      type: "follow",
    });

    return NextResponse.json({ 
      success: true, 
      message: status === "pending" ? "Follow request sent" : "Followed successfully",
      status
    }, { status: 201 });

  } catch (error) {
    console.error("Follow Error:", error);
    return NextResponse.json({ success: false, error: "Failed to follow user" }, { status: 500 });
  }
}

/**
 * @swagger
 * /follow/{id}:
 *   delete:
 *     summary: Unfollow a user
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
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const followerId = session.userId;
    const followingId = (await params).id;

    if (!mongoose.isValidObjectId(followingId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const existingFollow = await Follow.findOne({ followerId, followingId });
    if (!existingFollow) {
      return NextResponse.json({ success: false, error: "Not following" }, { status: 400 });
    }

    await Follow.findByIdAndDelete(existingFollow._id);

    // Only decrement if the status was accepted
    if (existingFollow.status === "accepted") {
      await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    }

    // Optionally remove the notification
    await Notification.findOneAndDelete({
      recipientId: followingId,
      actorId: followerId,
      type: "follow"
    });

    return NextResponse.json({ success: true, message: "Unfollowed successfully" }, { status: 200 });

  } catch (error) {
    console.error("Unfollow Error:", error);
    return NextResponse.json({ success: false, error: "Failed to unfollow user" }, { status: 500 });
  }
}
