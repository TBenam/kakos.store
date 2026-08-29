import { SupabaseClient } from '@supabase/supabase-js';
import { MediaStorageProvider } from './types';

export class SupabaseMediaStorageProvider implements MediaStorageProvider {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(supabaseClient: SupabaseClient, bucketName: string = 'products') {
    this.supabase = supabaseClient;
    this.bucketName = bucketName;
  }

  async upload(path: string, file: Buffer | Blob | ArrayBuffer, mimeType: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    return data.path; // Return the relative storage path inside the bucket
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase storage delete failed: ${error.message}`);
    }
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
