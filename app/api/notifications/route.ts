import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Notifications retrieved
 */
export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: session.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "name username avatar")
      .populate("postId", "content")
      .populate("commentId", "content")
      .lean();

    const total = await Notification.countDocuments({ recipientId: session.userId });
    const unreadCount = await Notification.countDocuments({ recipientId: session.userId, isRead: false });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Notifications Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
