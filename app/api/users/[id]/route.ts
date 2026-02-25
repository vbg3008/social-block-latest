import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import mongoose from "mongoose";

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       404:
 *         description: User not found
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    if (!mongoose.isValidObjectId((await params).id)) {
      return NextResponse.json({ success: false, error: "Invalid user ID format" }, { status: 400 });
    }

    const user = await User.findById((await params).id).select("-passwordHash -__v -emailVerificationToken -passwordResetToken");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    
    // If account is private, and not the current user, we might want to hide certain fields
    // This requires checking the session
    const session = await getAuthSession(req);
    const isOwner = session?.userId === (await params).id;
    
    if (user.isPrivate && !isOwner) {
       // Ideally verify if the requester is an accepted follower.
       // For simple demo, we return basic public info
       const publicProfile = {
           _id: user._id,
           name: user.name,
           username: user.username,
           avatar: user.avatar,
           isPrivate: true,
           followersCount: user.followersCount,
           followingCount: user.followingCount
       };
       return NextResponse.json({ success: true, data: publicProfile });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });

  } catch (error) {
    console.error("Get User Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    // Only owner or admin can update
    if (session.userId !== (await params).id && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    // Prevent updating sensitive fields directly
    const allowedUpdates = ["name", "bio", "avatar", "coverImage", "website", "location", "isPrivate"];
    const updateData: any = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      (await params).id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-passwordHash -__v");

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate user account
 *     tags: [Users]
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
 *         description: Account deactivated
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    // Only owner or admin can delete
    if (session.userId !== (await params).id && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    
    // Soft delete logic is typically better, but if we do hard delete:
    // We would need to cascade delete or update references (posts, likes, follows)
    // For simplicity, we'll mark account as banned/deleted instead of wiping data array
    
    const user = await User.findById((await params).id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    user.accountStatus = "suspended"; // Using suspended to represent 'deactivated' by user
    
    // To truly delete: await User.findByIdAndDelete((await params).id); 
    // And handle cascade deletes...
    
    await user.save();

    return NextResponse.json({ success: true, message: "Account deactivated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 });
  }
}
