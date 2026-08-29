import { SupabaseClient } from '@supabase/supabase-js';
import { MediaStorageProvider } from './types';
import { optimizeImage, generateDeterministicPath } from './optimizer';

export class MediaService {
  private supabase: SupabaseClient;
  private storageProvider: MediaStorageProvider;

  constructor(supabaseClient: SupabaseClient, storageProvider: MediaStorageProvider) {
    this.supabase = supabaseClient;
    this.storageProvider = storageProvider;
  }

  /**
   * Optimizes, uploads a product image, and registers its metadata in the DB.
   * Placed at the end of the gallery.
   */
  async uploadProductImage(productId: string, fileBuffer: Buffer): Promise<any> {
    // 1. Optimize the image (resize and convert to WebP)
    const { data: optimizedBuffer, mimeType } = await optimizeImage(fileBuffer);

    // 2. Generate deterministic storage path
    const storagePath = generateDeterministicPath(productId, optimizedBuffer);

    // 3. Upload to storage
    await this.storageProvider.upload(storagePath, optimizedBuffer, mimeType);

    // 4. Get the public URL
    const publicUrl = this.storageProvider.getPublicUrl(storagePath);

    // 5. Determine the next position in the gallery
    const { data: positionData, error: positionError } = await this.supabase
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1);

    if (positionError) {
      throw new Error(`Failed to query existing image positions: ${positionError.message}`);
    }

    const nextPosition = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;

    // 6. Insert metadata into public.product_images
    const { data: newImage, error: insertError } = await this.supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrl,
        position: nextPosition
      })
      .select()
      .single();

    if (insertError) {
      // Cleanup uploaded file if DB insert fails
      await this.storageProvider.delete(storagePath).catch(console.error);
      throw new Error(`Failed to register image metadata in DB: ${insertError.message}`);
    }

    return newImage;
  }

  /**
   * Deletes the image from storage and the DB metadata.
   */
  async deleteProductImage(imageId: string): Promise<void> {
    // 1. Fetch metadata from DB to get the URL
    const { data: imageData, error: fetchError } = await this.supabase
      .from('product_images')
      .select('url, product_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      throw new Error(`Image metadata not found: ${fetchError?.message || 'Unknown error'}`);
    }

    // 2. Parse the storage path from public URL
    // Format: https://[ref].supabase.co/storage/v1/object/public/[bucket]/products/[prod_id]/[hash].webp
    const urlParts = imageData.url.split('/products/');
    if (urlParts.length < 2) {
      throw new Error(`Could not parse storage path from URL: ${imageData.url}`);
    }
    const relativePath = 'products/' + urlParts[1];

    // 3. Delete from storage provider
    await this.storageProvider.delete(relativePath);

    // 4. Delete DB metadata row
    const { error: deleteError } = await this.supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      throw new Error(`Failed to delete image metadata: ${deleteError.message}`);
    }

    // 5. Clean up positions: reorder remaining images to fill the gap
    const { data: remainingImages, error: listError } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', imageData.product_id)
      .order('position', { ascending: true });

    if (!listError && remainingImages) {
      await this.reorderProductImages(
        imageData.product_id,
        remainingImages.map((img) => img.id)
      );
    }
  }

  /**
   * Reorders the images for a product according to the ordered array of IDs.
   */
  async reorderProductImages(productId: string, orderedImageIds: string[]): Promise<void> {
    for (let index = 0; index < orderedImageIds.length; index++) {
      const imageId = orderedImageIds[index];
      const { error } = await this.supabase
        .from('product_images')
        .update({ position: index })
        .eq('id', imageId)
        .eq('product_id', productId);

      if (error) {
        throw new Error(`Failed to reorder image ${imageId} to position ${index}: ${error.message}`);
      }
    }
  }

  /**
   * Sets a specific image as the primary image (position 0) and pushes others down.
   */
  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    // 1. Fetch all images for the product ordered by current position
    const { data: images, error: fetchError } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('position', { ascending: true });

    if (fetchError || !images) {
      throw new Error(`Failed to fetch product images for reordering: ${fetchError?.message}`);
    }

    // 2. Build the new ordered array with the primary image at index 0
    const otherImages = images.filter((img) => img.id !== imageId);
    const newOrder = [
      { id: imageId },
      ...otherImages
    ].map((img) => img.id);

    // 3. Apply the new order positions
    await this.reorderProductImages(productId, newOrder);
  }
}
