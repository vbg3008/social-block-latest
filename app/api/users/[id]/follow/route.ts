import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import Follow from "@/app/models/Follow";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    const targetUserId = (await params).id;
    const currentUserId = session.userId;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json({ success: false, error: "Cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerId: currentUserId,
      followingId: targetUserId
    });

    if (existingFollow) {
      // Unfollow logic
      await Follow.findByIdAndDelete(existingFollow._id);
      
      // Decrement counts
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
      
      return NextResponse.json({ success: true, message: "Unfollowed successfully", data: { isFollowing: false } });
    } else {
      // Follow logic
      // If private, status would be 'pending', but for simplicity assuming 'accepted'
      const status = targetUser.isPrivate ? "pending" : "accepted";
      
      await Follow.create({
        followerId: currentUserId,
        followingId: targetUserId,
        status
      });

      if (status === "accepted") {
        await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
        await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
      }

      // Create notification
      await Notification.create({
        recipientId: targetUserId,
        actorId: currentUserId,
        type: "follow"
      });

      return NextResponse.json({ success: true, message: "Followed successfully", data: { isFollowing: true, status } });
    }
  } catch (error) {
    console.error("Toggle Follow Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process follow request" }, { status: 500 });
  }
}
