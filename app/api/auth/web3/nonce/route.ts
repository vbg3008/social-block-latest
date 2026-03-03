import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";
import { generateNonce } from "siwe";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.toLowerCase();

    if (!address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 });
    }

    await connectDB();

    // Find the user by wallet address
    let user = await User.findOne({ walletAddress: address });

    // Generate a secure nonce for SIWE
    const nonce = generateNonce();

    // Create a temporary/placeholder user if one doesn't exist
    if (!user) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      user = await User.create({
        name: `Web3 User ${randomSuffix}`,
        username: `web3_${randomSuffix}`, 
        walletAddress: address,
        role: "user",
        avatar: `https://api.dicebear.com/9.x/micah/svg?seed=${address}`,
        nonce: nonce
      });
    } else {
      // Update existing user's nonce
      user.nonce = nonce;
      await user.save();
    }

    return NextResponse.json({ success: true, nonce });
  } catch (error: any) {
    console.error("Nonce generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate nonce" }, { status: 500 });
  }
}
