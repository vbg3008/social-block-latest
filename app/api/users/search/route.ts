import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";

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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      );
    }

    // Search by username or name using basic regex
    // For more advanced search, text indexes or MongoDB Atlas Search is recommended
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } }
      ],
      accountStatus: "active"
    })
    .select("name username avatar isVerified bio followersCount")
    .limit(20)
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
