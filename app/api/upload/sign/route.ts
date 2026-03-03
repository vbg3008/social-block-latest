import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import { pinata } from "@/lib/pinata.config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    const searchParams = new URL(req.url).searchParams;
    const name = searchParams.get("name") || "upload";

    const url = await pinata.upload.public.createSignedURL({
      expires: 300, // Valid for 5 minutes
      name: name,
    });

    return NextResponse.json({ success: true, url }, { status: 200 });
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return NextResponse.json({ success: false, error: "Failed to create signed URL" }, { status: 500 });
  }
}
