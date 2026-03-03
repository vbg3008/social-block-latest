import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@/app/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Hash token before saving to database (for security)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Set token and expiration (1 hour from now)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await user.save();

    // Create reset URL
    // Get the origin dynamically, fallback to localhost
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${token}`;

    // Send email
    await sendResetPasswordEmail(user.email, resetUrl);

    return NextResponse.json({ 
      success: true, 
      message: "If an account with that email exists, a password reset link has been sent." 
    });

  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
