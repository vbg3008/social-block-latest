import { NextResponse } from "next/server";

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the token cookie by setting expiration to a past date
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
