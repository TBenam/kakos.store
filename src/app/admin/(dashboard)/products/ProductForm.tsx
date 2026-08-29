'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { upsertProductAction, upsertVariantAction, deleteVariantAction, deleteProductImageAction, setPrimaryImageAction } from '@/app/admin/actions';

interface ProductFormProps {
  product?: any;
  categories: { id: string; name: string }[];
  variants: any[];
  images: any[];
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductForm({ product, categories, variants, images: initialImages }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Product fields
  const [title, setTitle] = useState(product?.title ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '');
  const [salePrice, setSalePrice] = useState(String(product?.sale_price ?? ''));
  const [supplierPrice, setSupplierPrice] = useState(String(product?.supplier_price ?? ''));
  const [promoPrice, setPromoPrice] = useState(String(product?.promo_price ?? ''));
  const [badge, setBadge] = useState(product?.badge ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isNew, setIsNew] = useState(product?.is_new ?? true);
  const [isBestseller, setIsBestseller] = useState(product?.is_bestseller ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);

  // Variants
  const [localVariants, setLocalVariants] = useState<any[]>(variants ?? []);
  const [variantForm, setVariantForm] = useState({ size: '', color: '', stock: '0' });
  const [variantMsg, setVariantMsg] = useState<string | null>(null);

  // Images
  const [images, setImages] = useState<any[]>([...initialImages].sort((a, b) => a.position - b.position));
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!product?.id) setSlug(generateSlug(val));
  };

  const handleSave = () => {
    startTransition(async () => {
      const data = {
        id: product?.id,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        category_id: categoryId,
        supplier_price: parseFloat(supplierPrice) || 0,
        sale_price: parseFloat(salePrice) || 0,
        promo_price: promoPrice ? parseFloat(promoPrice) : null,
        badge: badge.trim() || null,
        sku: sku.trim() || null,
        is_active: isActive,
        is_new: isNew,
        is_bestseller: isBestseller,
        is_featured: isFeatured,
      };

      const result = await upsertProductAction(data);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Produit enregistré avec succès.' });
        if (result?.id) {
          setTimeout(() => router.push(`/admin/products/${result.id}`), 600);
        }
      }
    });
  };

  const handleAddVariant = () => {
    if (!product?.id) { setVariantMsg('Enregistrez d\'abord le produit.'); return; }
    if (!variantForm.size || !variantForm.color) { setVariantMsg('Taille et couleur requis.'); return; }
    startTransition(async () => {
      const result = await upsertVariantAction({
        product_id: product.id,
        size: variantForm.size,
        color: variantForm.color,
        stock: parseInt(variantForm.stock) || 0,
      });
      if (result?.error) {
        setVariantMsg(result.error);
      } else {
        setVariantForm({ size: '', color: '', stock: '0' });
        setVariantMsg('Variante ajoutée.');
        router.refresh();
      }
    });
  };

  const handleDeleteVariant = (variantId: string) => {
    startTransition(async () => {
      await deleteVariantAction(variantId);
      setLocalVariants(prev => prev.filter(v => v.id !== variantId));
    });
  };

  const handleDeleteImage = (imageId: string, url: string) => {
    // extract storage path from url
    const parts = url.split('/products/');
    const storagePath = parts.length > 1 ? 'products/' + parts[1] : '';
    startTransition(async () => {
      await deleteProductImageAction(imageId, storagePath);
      setImages(prev => prev.filter(i => i.id !== imageId));
    });
  };

  const handleSetPrimary = (imageId: string) => {
    if (!product?.id) return;
    startTransition(async () => {
      await setPrimaryImageAction(product.id, imageId);
      setImages(prev => {
        const others = prev.filter(i => i.id !== imageId);
        const main = prev.find(i => i.id === imageId);
        return main ? [main, ...others] : prev;
      });
    });
  };

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || !product?.id) return;
    setUploadingImage(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', product.id);
      try {
        const res = await fetch('/api/admin/upload-image', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          setImages(prev => [...prev, data.image]);
        }
      } catch (e) { console.error('Upload failed', e); }
    }
    setUploadingImage(false);
  }, [product?.id]);

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-xs font-bold uppercase tracking-widest text-black">{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-black' : 'bg-[#e3e2e2]'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${value ? 'left-6' : 'left-1'}`} />
      </div>
    </label>
  );

  const inputCls = "w-full border border-[#c4c7c7] bg-transparent px-3 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors";
  const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5";

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-4xl font-bold text-black tracking-tighter uppercase">
            {product?.id ? 'Éditer Produit' : 'Nouveau Produit'}
          </h2>
          {product?.sku && <p className="text-xs text-[#444748] mt-1">SKU: {product.sku}</p>}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border-2 border-black text-black text-[11px] font-bold uppercase tracking-widest hover:bg-[#f5f3f3] transition-all"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#00F0FF] hover:text-black transition-all shadow-[4px_4px_0px_0px_#00F0FF] hover:shadow-[2px_2px_0px_0px_#0A0A0A] disabled:opacity-50"
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT — Main info */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Section: Général */}
          <section className="bg-white border border-[#e3e2e2] p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-5 border-b border-[#e3e2e2] pb-3">Général</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Nom du Produit *</label>
                <input className={inputCls} value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Ex: T-shirt KAKOS Monolith" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Slug (URL)</label>
                  <input className={`${inputCls} bg-[#f5f3f3] text-[#444748]`} value={slug} onChange={e => setSlug(e.target.value)} readOnly={!product?.id} />
                </div>
                <div>
                  <label className={labelCls}>Catégorie</label>
                  <select className={inputCls} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls} rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description du produit..." />
              </div>
            </div>
          </section>

          {/* Section: Médias */}
          <section className="bg-white border border-[#e3e2e2] p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-5 border-b border-[#e3e2e2] pb-3 flex justify-between">
              Médias
              <span className="text-[11px] font-normal text-[#444748]">{images.length} fichier{images.length !== 1 ? 's' : ''}</span>
            </h3>

            {/* Upload zone */}
            <label className={`border-2 border-dashed border-[#c4c7c7] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f5f3f3] transition-colors mb-4 ${!product?.id ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="material-symbols-outlined text-[48px] text-[#c4c7c7] mb-2">cloud_upload</span>
              <p className="text-sm font-bold text-black">
                {uploadingImage ? 'Upload en cours...' : 'Glissez-déposez ou cliquez pour uploader'}
              </p>
              <p className="text-xs text-[#444748] mt-1">JPG, PNG, WEBP — Max 5MB par fichier</p>
              {!product?.id && <p className="text-xs text-red-600 mt-2">Enregistrez d&apos;abord le produit pour uploader des images</p>}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => handleImageUpload(e.target.files)}
                disabled={!product?.id || uploadingImage}
              />
            </label>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={img.id} className={`relative group border p-1 bg-white ${idx === 0 ? 'border-black' : 'border-[#e3e2e2]'}`}>
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-black text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 z-10">
                        Principal
                      </span>
                    )}
                    <img src={img.url} alt="" className="w-full aspect-[3/4] object-cover" />
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-2 gap-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="w-full text-white text-[10px] font-bold uppercase tracking-widest hover:text-[#00F0FF] text-left flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          Principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id, img.url)}
                        className="w-full text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-300 text-left flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Variantes */}
          <section className="bg-white border border-[#e3e2e2] p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-5 border-b border-[#e3e2e2] pb-3">Variantes & Stock</h3>

            {/* Existing variants */}
            {localVariants.length > 0 ? (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-left min-w-[400px]">
                  <thead>
                    <tr className="bg-[#f5f3f3]">
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Taille</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Couleur</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Stock</th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {localVariants.map((v: any) => (
                      <tr key={v.id} className="border-b border-[#f5f3f3]">
                        <td className="px-3 py-2 text-sm font-bold text-black">{v.size}</td>
                        <td className="px-3 py-2 text-sm text-[#444748]">{v.color}</td>
                        <td className="px-3 py-2">
                          <span className={`text-sm font-bold ${v.stock === 0 ? 'text-red-600' : v.stock <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {v.stock}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="text-[10px] font-bold uppercase text-[#ba1a1a] hover:underline"
                          >
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#747878] mb-4">Aucune variante pour ce produit.</p>
            )}

            {/* Add variant form */}
            <div className="flex flex-wrap items-end gap-3 border-t border-[#e3e2e2] pt-4">
              <div className="flex-1 min-w-[100px]">
                <label className={labelCls}>Taille</label>
                <input className={inputCls} value={variantForm.size} onChange={e => setVariantForm(p => ({ ...p, size: e.target.value }))} placeholder="M, L, XL..." />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className={labelCls}>Couleur</label>
                <input className={inputCls} value={variantForm.color} onChange={e => setVariantForm(p => ({ ...p, color: e.target.value }))} placeholder="Noir, Gris..." />
              </div>
              <div className="w-24">
                <label className={labelCls}>Stock</label>
                <input className={inputCls} type="number" min={0} value={variantForm.stock} onChange={e => setVariantForm(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                disabled={isPending}
                className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#00F0FF] hover:text-black transition-all"
              >
                + Ajouter
              </button>
            </div>
            {variantMsg && <p className="text-xs mt-2 text-[#444748]">{variantMsg}</p>}
          </section>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Visibility */}
          <section className="bg-white border border-[#e3e2e2] p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-5 border-b border-[#e3e2e2] pb-3">Visibilité</h3>
            <div className="flex flex-col gap-4">
              <Toggle label="Publié (Actif)" value={isActive} onChange={setIsActive} />
              <Toggle label="Nouveau Produit" value={isNew} onChange={setIsNew} />
              <Toggle label="Bestseller" value={isBestseller} onChange={setIsBestseller} />
              <Toggle label="Featured" value={isFeatured} onChange={setIsFeatured} />
            </div>
          </section>

          {/* Prix */}
          <section className="bg-white border border-[#e3e2e2] p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-5 border-b border-[#e3e2e2] pb-3">Tarification</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Prix de Vente (FCFA) *</label>
                <input className={inputCls} type="number" min={0} value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="14900" />
              </div>
              <div>
                <label className={labelCls}>Prix Promo (FCFA)</label>
                <input className={inputCls} type="number" min={0} value={promoPrice} onChange={e => setPromoPrice(e.target.value)} placeholder="Optionnel" />
              </div>
              <div>
                <label className={labelCls}>Prix Fournisseur (FCFA)</label>
                <input className={inputCls} type="number" min={0} value={supplierPrice} onChange={e => setSupplierPrice(e.target.value)} placeholder="4000" />
              </div>
              {salePrice && supplierPrice && (
                <div className="bg-[#f5f3f3] p-3 border border-[#e3e2e2]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">Marge estimée</p>
                  <p className="text-base font-bold text-black mt-1">
                    {(parseFloat(salePrice) - parseFloat(supplierPrice)).toLocaleString('fr-FR')} F CFA
                    {' '}
                    <span className="text-sm font-normal text-[#444748]">
                      ({Math.round(((parseFloat(salePrice) - parseFloat(supplierPrice)) / parseFloat(salePrice)) * 100)}%)
                    </span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Organisation */}
          <section className="bg-white border border-[#e3e2e2] p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-5 border-b border-[#e3e2e2] pb-3">Organisation</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>SKU</label>
                <input className={inputCls} value={sku} onChange={e => setSku(e.target.value)} placeholder="Ex: KKS-DRP-042" />
              </div>
              <div>
                <label className={labelCls}>Badge personnalisé</label>
                <input className={inputCls} value={badge} onChange={e => setBadge(e.target.value)} placeholder="Ex: NEW DROP, PROMO..." />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
