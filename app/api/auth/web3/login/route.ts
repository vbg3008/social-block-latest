import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import { signToken } from "@/app/lib/auth";
import { SiweMessage } from "siwe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, signature } = body;

    if (!message || !signature) {
      return NextResponse.json(
        { success: false, error: "Message and signature are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Parse the SIWE message
    const siweMessage = new SiweMessage(message);
    
    // Find the user by the address in the message
    const user = await User.findOne({ walletAddress: siweMessage.address.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Please request a nonce first." },
        { status: 404 }
      );
    }

    if (!user.nonce) {
        return NextResponse.json(
            { success: false, error: "No nonce found for user. Please request one." },
            { status: 400 }
        );
    }

    // Verify the SIWE message
    // 1. Validate signature against the message
    // 2. Validate nonce matches the user's nonce in DB
    const { data: verifiedMessage } = await siweMessage.verify({
      signature,
      nonce: user.nonce
    });

    if (verifiedMessage) {
        // Clear the nonce to prevent replay attacks
        user.nonce = undefined;
        await user.save();

        // Generate application JWT token
        const token = signToken({ userId: user._id.toString(), role: user.role });

        const response = NextResponse.json(
            {
                success: true,
                data: {
                    token,
                    user: {
                        _id: user._id,
                        name: user.name,
                        username: user.username,
                        walletAddress: user.walletAddress,
                        avatar: user.avatar,
                        role: user.role
                    }
                }
            },
            { status: 200 }
        );

        // Set HTTP-only cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });

        return response;
    } else {
        return NextResponse.json(
            { success: false, error: "Invalid signature" },
            { status: 401 }
        );
    }
  } catch (error: any) {
    console.error("Web3 Login Error:", error);
    
    // Check if it's a SIWE specific error
    if (error.error?.type) {
         return NextResponse.json(
            { success: false, error: `Invalid signature or message: ${error.error.type}` },
            { status: 401 }
         );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
