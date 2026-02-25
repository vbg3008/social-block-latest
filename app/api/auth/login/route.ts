import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rate-limit";

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials format
 *       401:
 *         description: Incorrect credentials
 *       429:
 *         description: Rate limit exceeded
 */
export async function POST(req: Request) {
  try {
    // Apply Rate Limiting (10 requests per 15 minutes for auth endpoints)
    const limitResult = await rateLimit(req, 10);
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts, please try again later." },
        { status: 429, headers: { "X-RateLimit-Reset": limitResult.resetAt.toString() } }
      );
    }

    await connectDB();
    
    const body = await req.json();
    const { email, username, password } = body;

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide valid credentials" },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username: username?.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    if (user.accountStatus === "banned" || user.accountStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: `Account is ${user.accountStatus}` },
        { status: 403 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token
    const token = signToken({ userId: user._id.toString(), role: user.role });

    // Set HTTP-only cookie if required (often handled dynamically by client or next headers)
    const response = NextResponse.json(
      { 
        success: true, 
        data: { 
          token,
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role
          }
        } 
      },
      { status: 200 }
    );
    
    // Example of setting cookie:
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
