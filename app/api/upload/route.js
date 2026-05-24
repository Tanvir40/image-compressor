import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Optional: remove DB if you don't have the table
// import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const quality = parseInt(formData.get("quality")) || 70;
    const format = formData.get("format") || "jpeg";
    const targetWidth = parseInt(formData.get("width")) || null;
    const targetHeight = parseInt(formData.get("height")) || null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 50MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const timestamp = Date.now();

    // 1. Save original file (preserve original extension)
    const originalExt = file.name.split(".").pop();
    const originalName = `${timestamp}_original.${originalExt}`;
    const originalPath = `/uploads/${originalName}`;
    fs.writeFileSync(path.join(uploadDir, originalName), buffer);

    // 2. Sharp processing
    let sharpInstance = sharp(buffer);

    // Apply resize if requested (maintains aspect ratio automatically)
    if (targetWidth || targetHeight) {
      sharpInstance = sharpInstance.resize({
        width: targetWidth || undefined,
        height: targetHeight || undefined,
        fit: "inside",          // never crop, only fit inside given dimensions
        withoutEnlargement: true,
      });
    }

    let compressedBuffer;
    let ext = format;

    switch (format) {
      case "jpeg":
      case "jpg":
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        ext = "jpg";
        break;
      case "png":
        // PNG: quality maps to compressionLevel (0=fast/big, 9=slow/small)
        // Quality 100 → level 0, Quality 0 → level 9
        const level = Math.floor((100 - quality) / 11.11);
        const compressionLevel = Math.min(9, Math.max(0, level));
        compressedBuffer = await sharpInstance
          .png({ compressionLevel })
          .toBuffer();
        break;
      case "webp":
        compressedBuffer = await sharpInstance.webp({ quality }).toBuffer();
        break;
      case "avif":
        compressedBuffer = await sharpInstance.avif({ quality }).toBuffer();
        break;
      default:
        return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }

    // Get final dimensions
    const metadata = await sharp(compressedBuffer).metadata();

    const compressedName = `${timestamp}_compressed.${ext}`;
    const compressedPath = `/uploads/${compressedName}`;
    fs.writeFileSync(path.join(uploadDir, compressedName), compressedBuffer);

    // Optional: save to database (skip if table doesn't exist)
    // try {
    //   await db.execute(`INSERT INTO images (...) VALUES (...)`);
    // } catch (err) { console.warn("DB skip"); }

    // Format file sizes nicely
    const originalSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
    const compressedSizeMB = (compressedBuffer.length / (1024 * 1024)).toFixed(2);
    const compressedSize = compressedBuffer.length > 1024 * 1024
      ? `${compressedSizeMB} MB`
      : `${compressedSizeKB} KB`;

    return NextResponse.json({
      success: true,
      original: originalPath,
      compressed: compressedPath,
      originalSize: `${originalSizeMB} MB`,
      compressedSize: compressedSize,
      compressedDimensions: {
        width: metadata.width,
        height: metadata.height,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}