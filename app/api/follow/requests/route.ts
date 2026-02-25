import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import Follow from "@/app/models/Follow";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /follow/requests:
 *   get:
 *     summary: Get pending follow requests
 *     tags: [Follow System]
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
 *         description: Requests retrieved successfully
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

    // Requests aimed at the current logged in user
    const requests = await Follow.find({
      followingId: session.userId,
      status: "pending"
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("followerId", "name username avatar")
    .lean();

    const total = await Follow.countDocuments({ followingId: session.userId, status: "pending" });

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Follow Requests Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch requests" }, { status: 500 });
  }
}
