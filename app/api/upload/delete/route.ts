import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import { pinata } from "@/lib/pinata.config";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const { cid } = body;

    if (!cid) {
      return NextResponse.json({ success: false, error: "Missing CID parameter" }, { status: 400 });
    }

    // Call Pinata SDK to unpin the file
    // The "delete" method belongs to the "public" (or private) files class.
    await pinata.files.public.delete([cid]);

    return NextResponse.json({ success: true, message: "File unpinned successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting file from Pinata:", error);
    return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
  }
}
