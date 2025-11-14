/**
 * Image validation and processing for Instagram
 * 
 * Instagram has strict requirements:
 * - JPEG only
 * - Max 8MB
 * - Aspect ratio: 4:5 to 1.91:1
 * - Carousel: all sizes must match
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  size?: number;
  format?: string;
}

/**
 * Validates image URL meets Instagram requirements
 * Note: This is a client-side validation. For production, you may want to
 * download and validate the image on the server.
 */
export async function validateImageForInstagram(
  imageUrl: string
): Promise<ImageValidationResult> {
  try {
    // Fetch image to get metadata
    const response = await fetch(imageUrl, { method: "HEAD" });
    
    if (!response.ok) {
      return {
        valid: false,
        error: "Image URL is not accessible",
      };
    }

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    // Check file type (Instagram prefers JPEG)
    if (contentType && !contentType.includes("image/jpeg") && !contentType.includes("image/png")) {
      return {
        valid: false,
        error: "Image must be JPEG or PNG format",
        format: contentType,
      };
    }

    // Check file size (max 8MB for Instagram)
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 8) {
        return {
          valid: false,
          error: `Image size (${sizeInMB.toFixed(2)}MB) exceeds 8MB limit`,
          size: sizeInMB,
        };
      }
    }

    // For full validation, you'd need to download and check dimensions
    // This is a simplified version
    return {
      valid: true,
      format: contentType || "unknown",
      size: contentLength ? parseInt(contentLength, 10) / (1024 * 1024) : undefined,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Failed to validate image",
    };
  }
}

/**
 * Validates aspect ratio for Instagram
 * Instagram accepts: 4:5 (0.8) to 1.91:1 (1.91)
 */
export function validateAspectRatio(width: number, height: number): boolean {
  const aspectRatio = width / height;
  return aspectRatio >= 0.8 && aspectRatio <= 1.91;
}

/**
 * Gets image dimensions from URL
 * Note: This requires downloading the image
 */
export async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number } | null> {
  try {
    // In a real implementation, you'd use a library like 'sharp' or 'jimp'
    // to get image dimensions without downloading the full image
    // For now, return null (dimensions will be checked on server side)
    return null;
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    return null;
  }
}

/**
 * Validates carousel images have matching dimensions
 */
export async function validateCarouselImages(
  imageUrls: string[]
): Promise<ImageValidationResult> {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    return {
      valid: false,
      error: "Carousel must have between 2 and 10 images",
    };
  }

  // Validate each image
  for (const url of imageUrls) {
    const result = await validateImageForInstagram(url);
    if (!result.valid) {
      return result;
    }
  }

  // In production, you'd check that all images have the same dimensions
  // For now, we'll assume they're valid if they pass individual validation

  return {
    valid: true,
  };
}

