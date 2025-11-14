import sharp from "sharp";

/**
 * Image processing utilities for Instagram
 * 
 * Instagram requirements:
 * - JPEG format (preferred)
 * - Max 8MB
 * - Aspect ratio: 4:5 (0.8) to 1.91:1 (1.91)
 * - Recommended size: 1080px width
 * - Carousel: all images must have same dimensions
 */

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  format?: "jpeg" | "png" | "webp";
  quality?: number;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
}

export interface ImageProcessingResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
}

/**
 * Processes an image for Instagram requirements
 */
export async function processImageForInstagram(
  imageBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ImageProcessingResult> {
  const {
    width = 1080,
    format = "jpeg",
    quality = 90,
    aspectRatio = "auto",
  } = options;

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || width;
  const originalHeight = metadata.height || width;
  const originalAspectRatio = originalWidth / originalHeight;

  // Calculate target dimensions based on aspect ratio
  let targetWidth = width;
  let targetHeight: number;

  if (aspectRatio === "square") {
    targetHeight = targetWidth;
  } else if (aspectRatio === "portrait") {
    // 4:5 aspect ratio (Instagram portrait)
    targetHeight = Math.round(targetWidth / 0.8);
  } else if (aspectRatio === "landscape") {
    // 1.91:1 aspect ratio (Instagram landscape)
    targetHeight = Math.round(targetWidth / 1.91);
  } else {
    // Auto: maintain original aspect ratio, but ensure it's within Instagram limits
    if (originalAspectRatio < 0.8) {
      // Too tall, crop to 4:5
      targetHeight = Math.round(targetWidth / 0.8);
    } else if (originalAspectRatio > 1.91) {
      // Too wide, crop to 1.91:1
      targetHeight = Math.round(targetWidth / 1.91);
    } else {
      // Within limits, maintain aspect ratio
      targetHeight = Math.round(targetWidth / originalAspectRatio);
    }
  }

  // Resize image
  let processedImage = sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

  // Convert to JPEG if needed
  if (format === "jpeg") {
    processedImage = processedImage.jpeg({ quality });
  } else if (format === "png") {
    processedImage = processedImage.png({ quality });
  } else if (format === "webp") {
    processedImage = processedImage.webp({ quality });
  }

  // Get processed buffer
  const processedBuffer = await processedImage.toBuffer();

  // Get final metadata
  const finalMetadata = await sharp(processedBuffer).metadata();
  const finalWidth = finalMetadata.width || targetWidth;
  const finalHeight = finalMetadata.height || targetHeight;
  const finalAspectRatio = finalWidth / finalHeight;

  // Validate size (max 8MB for Instagram)
  const sizeInBytes = processedBuffer.length;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > 8) {
    // If too large, reduce quality
    const reducedQuality = Math.max(50, quality - 20);
    const reducedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: reducedQuality })
      .toBuffer();

    const reducedSizeInMB = reducedBuffer.length / (1024 * 1024);
    
    if (reducedSizeInMB > 8) {
      // Still too large, reduce dimensions
      const scaleFactor = Math.sqrt(8 / reducedSizeInMB);
      const scaledWidth = Math.round(targetWidth * scaleFactor);
      const scaledHeight = Math.round(targetHeight * scaleFactor);
      
      const finalBuffer = await sharp(imageBuffer)
        .resize(scaledWidth, scaledHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: reducedQuality })
        .toBuffer();

      const finalScaledMetadata = await sharp(finalBuffer).metadata();
      
      return {
        buffer: finalBuffer,
        width: finalScaledMetadata.width || scaledWidth,
        height: finalScaledMetadata.height || scaledHeight,
        format: "jpeg",
        size: finalBuffer.length / (1024 * 1024),
        aspectRatio: (finalScaledMetadata.width || scaledWidth) / (finalScaledMetadata.height || scaledHeight),
      };
    }

    const reducedMetadata = await sharp(reducedBuffer).metadata();
    return {
      buffer: reducedBuffer,
      width: reducedMetadata.width || targetWidth,
      height: reducedMetadata.height || targetHeight,
      format: "jpeg",
      size: reducedSizeInMB,
      aspectRatio: (reducedMetadata.width || targetWidth) / (reducedMetadata.height || targetHeight),
    };
  }

  return {
    buffer: processedBuffer,
    width: finalWidth,
    height: finalHeight,
    format: format,
    size: sizeInMB,
    aspectRatio: finalAspectRatio,
  };
}

/**
 * Processes multiple images for Instagram carousel
 * Ensures all images have the same dimensions
 */
export async function processImagesForCarousel(
  imageBuffers: Buffer[],
  options: ImageProcessingOptions = {}
): Promise<ImageProcessingResult[]> {
  if (imageBuffers.length < 2 || imageBuffers.length > 10) {
    throw new Error("Carousel must have between 2 and 10 images");
  }

  // Process first image to get dimensions
  const firstImage = await processImageForInstagram(imageBuffers[0], options);
  const targetWidth = firstImage.width;
  const targetHeight = firstImage.height;
  const targetAspectRatio = firstImage.aspectRatio;

  // Process remaining images with same dimensions
  const processedImages: ImageProcessingResult[] = [firstImage];

  for (let i = 1; i < imageBuffers.length; i++) {
    const processed = await processImageForInstagram(imageBuffers[i], {
      ...options,
      width: targetWidth,
      height: targetHeight,
      aspectRatio: "auto",
    });

    // Ensure same dimensions (crop if needed)
    if (processed.width !== targetWidth || processed.height !== targetHeight) {
      const cropped = await sharp(processed.buffer)
        .resize(targetWidth, targetHeight, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: options.quality || 90 })
        .toBuffer();

      const croppedMetadata = await sharp(cropped).metadata();
      processedImages.push({
        buffer: cropped,
        width: croppedMetadata.width || targetWidth,
        height: croppedMetadata.height || targetHeight,
        format: "jpeg",
        size: cropped.length / (1024 * 1024),
        aspectRatio: targetAspectRatio,
      });
    } else {
      processedImages.push(processed);
    }
  }

  return processedImages;
}

/**
 * Validates image meets Instagram requirements
 */
export async function validateImageForInstagram(
  imageBuffer: Buffer
): Promise<{ valid: boolean; error?: string; metadata?: any }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const aspectRatio = width / height;
    const sizeInMB = imageBuffer.length / (1024 * 1024);

    // Check size (max 8MB)
    if (sizeInMB > 8) {
      return {
        valid: false,
        error: `Image size (${sizeInMB.toFixed(2)}MB) exceeds 8MB limit`,
        metadata: { width, height, aspectRatio, size: sizeInMB },
      };
    }

    // Check aspect ratio (4:5 to 1.91:1)
    if (aspectRatio < 0.8 || aspectRatio > 1.91) {
      return {
        valid: false,
        error: `Image aspect ratio (${aspectRatio.toFixed(2)}) is outside Instagram's allowed range (0.8 to 1.91)`,
        metadata: { width, height, aspectRatio, size: sizeInMB },
      };
    }

    // Check format (JPEG, PNG, WebP)
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      return {
        valid: false,
        error: `Image format (${metadata.format}) is not supported. Instagram accepts JPEG, PNG, or WebP`,
        metadata: { width, height, aspectRatio, size: sizeInMB, format: metadata.format },
      };
    }

    return {
      valid: true,
      metadata: { width, height, aspectRatio, size: sizeInMB, format: metadata.format },
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Failed to validate image",
    };
  }
}

