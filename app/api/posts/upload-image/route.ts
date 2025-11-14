import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processImageForInstagram, validateImageForInstagram } from "@/lib/meta/image-processor";

/**
 * POST /api/posts/upload-image
 * Uploads an image to Supabase Storage and returns the public URL
 * 
 * Optional query parameters:
 * - processForInstagram: true/false - Process image for Instagram requirements
 * - width: number - Target width (default: 1080)
 * - quality: number - JPEG quality (default: 90)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const processForInstagram = searchParams.get("processForInstagram") === "true";
    const targetWidth = parseInt(searchParams.get("width") || "1080");
    const quality = parseInt(searchParams.get("quality") || "90");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB before processing)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let processedBuffer: Buffer;
    let fileName: string;
    let contentType: string;

    if (processForInstagram) {
      // Validate image for Instagram
      const validation = await validateImageForInstagram(buffer);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Image validation failed" },
          { status: 400 }
        );
      }

      // Process image for Instagram
      const processed = await processImageForInstagram(buffer, {
        width: targetWidth,
        format: "jpeg",
        quality: quality,
        aspectRatio: "auto",
      });

      processedBuffer = processed.buffer;
      fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      contentType = "image/jpeg";
    } else {
      // Upload original file
      processedBuffer = buffer;
      const fileExt = file.name.split(".").pop();
      fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      contentType = file.type;
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(fileName, processedBuffer, {
        contentType: contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName,
      ...(processForInstagram && {
        processed: true,
        width: targetWidth,
        format: "jpeg",
      }),
    });
  } catch (error: any) {
    console.error("Error in upload-image route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
