/**
 * KAKOS Media Storage Provider Interface
 * Allows future migration to other providers (e.g. Cloudflare R2) without modifying business logic.
 */
export interface MediaStorageProvider {
  /**
   * Uploads a file buffer or blob to the storage provider at a deterministic path
   * @param path The deterministic path inside the storage bucket (e.g. "products/prod_123/image_hash.webp")
   * @param file The file data as Buffer, Blob, or ArrayBuffer
   * @param mimeType The file mime type (e.g. "image/webp")
   * @returns The storage path identifier or URL where the file is stored
   */
  upload(path: string, file: Buffer | Blob | ArrayBuffer, mimeType: string): Promise<string>;

  /**
   * Deletes a file from the storage provider
   * @param path The storage path identifier of the file to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Generates the public accessible URL for a given storage path
   * @param path The storage path identifier
   * @returns The public URL string
   */
  getPublicUrl(path: string): string;
}
