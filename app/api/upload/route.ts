import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/app/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a media file
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: No file provided
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ success: false, error: "No file provided under 'file' form data key" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFilename = `${uuidv4()}-${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
      await writeFile(path.join(uploadDir, uniqueFilename), buffer);
    } catch (e: any) {
      if (e.code === "ENOENT") {
        const fs = await import("fs");
        fs.mkdirSync(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, uniqueFilename), buffer);
      } else {
        throw e;
      }
    }

    const fileUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ 
      success: true, 
      message: "Media uploaded successfully",
      data: {
        url: fileUrl,
        type: file.type,
        publicId: uniqueFilename
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Upload Media Error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload media" }, { status: 500 });
  }
}
