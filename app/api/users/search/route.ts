import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import { getAuthSession } from "@/app/lib/auth";

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users by username or name
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of matching users
 */
export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getAuthSession(req);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    let queryObj: any = { accountStatus: "active" };

    // Exclude the currently logged-in user from search/suggestions
    if (session) {
      queryObj._id = { $ne: session.userId };
    }

    if (query && query.trim().length > 0) {
      queryObj = {
        ...queryObj,
        $or: [
           { username: { $regex: query, $options: "i" } },
           { name: { $regex: query, $options: "i" } }
        ]
      };
    }

    // Search by username or name using basic regex
    // If no query, returns top users by follower count
    const users = await User.find(queryObj)
    .select("name username avatar isVerified bio followersCount")
    .sort({ followersCount: -1 }) // Sort top followed users for suggestions
    .limit(5)
    .lean();

    return NextResponse.json(
      { success: true, data: users },
      { status: 200 }
    );

  } catch (error) {
    console.error("Search Users Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search users" },
      { status: 500 }
    );
  }
}
