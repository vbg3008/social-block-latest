import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Notification from "@/app/models/Notification";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    await connectDB();

    const notification = await Notification.findOne({
      _id: (await params).id,
      recipientId: session.userId
    });

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({ success: true, data: notification }, { status: 200 });

  } catch (error) {
    console.error("Read Notification Error:", error);
    return NextResponse.json({ success: false, error: "Failed to mark notification as read" }, { status: 500 });
  }
}
