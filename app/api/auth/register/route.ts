import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rate-limit";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
export async function POST(req: Request) {
  try {
    // Apply Rate Limiting (5 requests per 15 mins for registration)
    const limitResult = await rateLimit(req, 5);
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts, please try again later." },
        { status: 429, headers: { "X-RateLimit-Reset": limitResult.resetAt.toString() } }
      );
    }

    await connectDB();
    
    const body = await req.json();
    const { name, username, email, password } = body;

    // Validation
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide all required fields (name, username, email, password)" },
        { status: 400 }
      );
    }

    // Checking for existing user
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "Username already taken" }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with a generated avatar
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username.toLowerCase()}`
    });

    // Generate token
    const token = signToken({ userId: user._id.toString(), role: user.role });

    // Remove password from response
    const { passwordHash: _, ...userResponse } = user.toObject();

    const response = NextResponse.json(
      { 
        success: true, 
        data: { user: userResponse, token } 
      }, 
      { status: 201 }
    );

    // Set the cookie properly so the user is logged in
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}
