import { supabase } from "./supabase";
import { makeSlug } from "./productUtils";

export { makeSlug } from "./productUtils";

const PRODUCT_FIELDS =
  "id, title, type, description, price, slug, status, is_featured, available_sizing, available_colors, created_at, updated_at";

const IMAGE_FIELDS = "id, product_id, public_url, colorway_label, sort_order";

function mapProductImages(products, images) {
  const byProductId = new Map();
  for (const img of images || []) {
    const arr = byProductId.get(img.product_id) || [];
    arr.push(img);
    byProductId.set(img.product_id, arr);
  }

  return (products || []).map((p) => {
    const imgs = (byProductId.get(p.id) || []).sort((a, b) => a.sort_order - b.sort_order);
    return {
      ...p,
      images: imgs,
      imageUrls: imgs.map((i) => i.public_url),
      heroImage: imgs.length ? imgs[0].public_url : null,
    };
  });
}

async function fetchImagesForProducts(productIds) {
  if (!productIds.length) return [];

  const { data, error } = await supabase
    .from("product_images")
    .select(IMAGE_FIELDS)
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchImagesForProducts error:", error);
    return [];
  }

  return data || [];
}

export async function fetchPublicProducts() {
  if (!supabase) return [];

  const { data: products, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "Published")
    .order("is_featured", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("fetchPublicProducts error:", error);
    return [];
  }

  if (!products?.length) return [];

  const images = await fetchImagesForProducts(products.map((p) => p.id));
  return mapProductImages(products, images);
}

export async function fetchAdminProducts() {
  if (!supabase) return [];

  const { data: products, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("fetchAdminProducts error:", error);
    throw error;
  }

  const images = await fetchImagesForProducts((products || []).map((p) => p.id));
  return mapProductImages(products || [], images);
}

export async function fetchProductBySlugOrId(slugOrId) {
  if (!supabase || !slugOrId) return null;

  const [bySlug, byId] = await Promise.all([
    supabase.from("products").select(PRODUCT_FIELDS).eq("slug", slugOrId).eq("status", "Published").limit(1),
    supabase.from("products").select(PRODUCT_FIELDS).eq("id", slugOrId).eq("status", "Published").limit(1),
  ]);

  const product = bySlug.data?.[0] || byId.data?.[0] || null;
  if (!product) return null;

  const images = await fetchImagesForProducts([product.id]);
  return mapProductImages([product], images)[0];
}

export async function uploadProductImageFile(file, productId) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
  if (!urlData?.publicUrl) throw new Error("Could not resolve public URL for uploaded image.");

  return urlData.publicUrl;
}

export async function saveProductRecord(draft) {
  const payload = {
    title: draft.title.trim(),
    type: draft.type.trim(),
    description: draft.description.trim(),
    price: draft.price.trim(),
    status: draft.status,
    is_featured: Boolean(draft.is_featured),
    available_sizing: draft.available_sizing || [],
    available_colors: draft.available_colors || [],
    slug: draft.slug?.trim() || makeSlug(draft.title),
  };

  if (!payload.title) throw new Error("Product title is required.");

  let productId = draft.id;

  if (productId) {
    const { error } = await supabase.from("products").update(payload).eq("id", productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("products").insert([payload]).select("id").single();
    if (error) throw error;
    productId = data.id;
  }

  const existingImages = draft.images || [];
  const pendingFiles = draft.pendingFiles || [];

  for (let index = 0; index < pendingFiles.length; index += 1) {
    const entry = pendingFiles[index];
    const publicUrl = await uploadProductImageFile(entry.file, productId);
    const { error } = await supabase.from("product_images").insert([
      {
        product_id: productId,
        public_url: publicUrl,
        colorway_label: entry.colorway_label?.trim() || null,
        sort_order: existingImages.length + index,
      },
    ]);
    if (error) throw error;
  }

  for (const image of existingImages) {
    if (!image.id) continue;
    const { error } = await supabase
      .from("product_images")
      .update({
        colorway_label: image.colorway_label?.trim() || null,
        sort_order: image.sort_order,
      })
      .eq("id", image.id);
    if (error) throw error;
  }

  const refreshed = await fetchAdminProducts();
  return refreshed.find((p) => p.id === productId) || null;
}

export async function deleteProductRecord(productId) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

export async function deleteProductImage(imageId) {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function ensureProductSlug(productId, title) {
  if (!supabase) return;
  const slug = makeSlug(title);
  if (!slug) return;

  await supabase.from("products").update({ slug }).eq("id", productId);
}
