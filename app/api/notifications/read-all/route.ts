import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();

    await Notification.updateMany(
      { recipientId: session.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ success: true, message: "All notifications marked as read" }, { status: 200 });

  } catch (error) {
    console.error("Read All Notifications Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update notifications" }, { status: 500 });
  }
}
