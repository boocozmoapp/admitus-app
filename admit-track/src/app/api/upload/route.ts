import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Use PDF, Word, image, or Excel." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Sanitise original name, append timestamp for uniqueness
    const ext = path.extname(file.name) || ".bin";
    const baseName = path.basename(file.name, ext)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const filename = `${baseName}_${Date.now()}${ext}`;

    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
