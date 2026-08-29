import sharp from 'sharp';

/**
 * Optimizes an image buffer by resizing and converting it to WebP
 * @param buffer The raw image buffer (JPEG, PNG, etc.)
 * @param maxWidth Optional maximum width (default: 1200px)
 * @param quality Optional WebP compression quality (default: 80)
 * @returns Object containing the optimized buffer and the new MIME type
 */
export async function optimizeImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  quality: number = 80
): Promise<{ data: Buffer; mimeType: string }> {
  try {
    const pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // Only resize if the image is wider than maxWidth
    if (metadata.width && metadata.width > maxWidth) {
      pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    // Convert to webp with the specified quality
    const optimizedBuffer = await pipeline
      .webp({ quality })
      .toBuffer();

    return {
      data: optimizedBuffer,
      mimeType: 'image/webp'
    };
  } catch (error: any) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
}

/**
 * Helper to generate a deterministic file path based on a hash of the image data
 * @param productId ID of the product
 * @param buffer The image buffer to hash
 * @returns A deterministic path like "products/prod_123/a1b2c3d4.webp"
 */
export function generateDeterministicPath(productId: string, buffer: Buffer): string {
  // Simple quick hash implementation of the buffer
  let hash = 0;
  for (let i = 0; i < buffer.length; i++) {
    hash = (hash << 5) - hash + buffer[i];
    hash |= 0; // Convert to 32bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  
  return `products/${productId}/${hexHash}.webp`;
}
