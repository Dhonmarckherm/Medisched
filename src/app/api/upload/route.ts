import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Verify a file's magic bytes match its declared MIME type.
// The client-supplied File.type is trivially spoofable, so we inspect the
// actual leading bytes of the buffer before accepting the upload.
async function verifyFileSignature(file: File, declaredType: string): Promise<boolean> {
  try {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const startsWith = (bytes: number[], offset = 0) =>
      bytes.every((b, i) => header[offset + i] === b);
    const ascii = (s: string, offset = 0) =>
      [...s].every((c, i) => header[offset + i] === c.charCodeAt(0));

    switch (declaredType) {
      case "image/jpeg":
        return startsWith([0xff, 0xd8, 0xff]);
      case "image/png":
        return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      case "image/webp":
        return ascii("RIFF", 0) && ascii("WEBP", 8);
      case "application/pdf":
        return ascii("%PDF", 0);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// POST /api/upload — Upload a file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const rawType = formData.get("type") as string || "appointment"; // appointment or certificate

    // Only allow known buckets — prevents path traversal via the `type` field
    const ALLOWED_BUCKETS = ["appointment", "certificate"];
    if (!ALLOWED_BUCKETS.includes(rawType)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }
    const type = rawType;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    // Validate declared MIME type
    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
    };
    const extension = allowedTypes[file.type];
    if (!extension) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP, and PDF files are allowed" }, { status: 400 });
    }

    // Verify the file's actual magic bytes match the declared type (client MIME is spoofable)
    const signatureOk = await verifyFileSignature(file, file.type);
    if (!signatureOk) {
      return NextResponse.json({ error: "File content does not match its declared type" }, { status: 400 });
    }

    // Get user's DB record
    const supabaseAdmin = createServiceClient();
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .limit(1);

    if (!dbUser?.[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser[0].id;
    // Server-generated key with a safe, extension derived from the validated MIME
    // (never trust file.name for the storage path).
    const fileName = `${type}/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("attachments")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("attachments")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      path: fileName,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
