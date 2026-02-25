import jwt, { SignOptions } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-fallback-key-for-dev";

// Types
export interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Sign a JWT token
 */
export const signToken = (payload: TokenPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Helper to get the authenticated user from the Request headers or Cookies
 * @returns TokenPayload if auth is valid, null otherwise
 */
export const getAuthSession = async (req: Request): Promise<TokenPayload | null> => {
  try {
    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers.get("Authorization");
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // 2. Fallback to extracting from cookies
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get("token");
      if (tokenCookie) {
        token = tokenCookie.value;
      }
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    return null;
  }
};

/**
 * Reusable unauthorized response
 */
export const unauthorizedResponse = (message = "Unauthorized access") => {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
};
