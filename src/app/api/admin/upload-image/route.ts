import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { optimizeImage } from '@/lib/storage/optimizer';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file || !productId) {
      return NextResponse.json({ error: 'File et productId requis' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Optimize
    const { data: optimizedBuffer, mimeType } = await optimizeImage(buffer);

    // Generate path
    let hash = 0;
    for (let i = 0; i < optimizedBuffer.length; i++) {
      hash = (hash << 5) - hash + optimizedBuffer[i];
      hash |= 0;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    const storagePath = `products/${productId}/${hexHash}.webp`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(storagePath, optimizedBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // Get next position
    const { data: positionData } = await supabase
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;

    // Insert into DB
    const { data: newImage, error: insertError } = await supabase
      .from('product_images')
      .insert({ product_id: productId, url: publicUrl, position: nextPosition })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from('products').remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ image: newImage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
