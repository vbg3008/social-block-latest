import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account suspended or banned
 */
export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    
    if (!session) {
      return unauthorizedResponse();
    }

    await connectDB();

    const user = await User.findById(session.userId).select("-passwordHash -__v -emailVerificationToken -passwordResetToken");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user.accountStatus === "banned" || user.accountStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: `Account is ${user.accountStatus}` },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
