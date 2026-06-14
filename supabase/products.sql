-- Likitu products CMS
-- Run this entire script in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  type text,
  description text,
  price text,

  is_featured boolean not null default false,
  status text not null default 'Published',

  slug text unique,

  available_sizing text[] not null default '{}',
  available_colors text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists available_sizing text[] not null default '{}';
alter table public.products add column if not exists available_colors text[] not null default '{}';

create index if not exists products_is_featured_idx on public.products(is_featured);
create index if not exists products_status_idx on public.products(status);

-- ---------------------------------------------------------------------------
-- Product images (multiple per product / colorways)
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,

  public_url text not null,
  colorway_label text,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_images add column if not exists colorway_label text;

create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_sort_order_idx on public.product_images(product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "Products: authenticated full access" on public.products;
create policy "Products: authenticated full access"
  on public.products
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Product images: authenticated full access" on public.product_images;
create policy "Product images: authenticated full access"
  on public.product_images
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Products: public read published" on public.products;
create policy "Products: public read published"
  on public.products
  for select
  to anon, authenticated
  using (status = 'Published');

drop policy if exists "Product images: public read for published products" on public.product_images;
create policy "Product images: public read for published products"
  on public.product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.status = 'Published'
    )
  );

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_images_updated_at on public.product_images;
create trigger set_product_images_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket for product images
-- Create the bucket in Dashboard → Storage if this insert fails.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Product images: public read" on storage.objects;
create policy "Product images: public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "Product images: authenticated upload" on storage.objects;
create policy "Product images: authenticated upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Product images: authenticated update" on storage.objects;
create policy "Product images: authenticated update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "Product images: authenticated delete" on storage.objects;
create policy "Product images: authenticated delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- Seed the original Likitu catalogue (safe to re-run)
-- Upload images via /admin → Collections after running this.
-- ---------------------------------------------------------------------------
insert into public.products (
  title,
  type,
  description,
  price,
  slug,
  status,
  is_featured,
  available_sizing,
  available_colors
)
values
  (
    'Marigold Carryall',
    'Crochet bag',
    'A sculptural handmade carryall with floral detail and soft structure.',
    'From R650',
    'marigold-carryall',
    'Published',
    true,
    array['XS', 'Small', 'Medium', 'Large', 'XL', 'Custom Measurements'],
    array['Marigold floral', 'Plain marigold']
  ),
  (
    'Sculpted Shoulder Bag',
    'Statement shoulder bag',
    'One refined shoulder bag silhouette available in noir, nude, and vermilion colourways.',
    'From R720',
    'sculpted-shoulder-bag',
    'Published',
    true,
    array['Not Applicable'],
    array['Noir', 'Nude', 'Vermilion']
  ),
  (
    'Petit Bucket',
    'Compact crochet bag',
    'A compact bucket form for delicate everyday carrying.',
    'From R580',
    'petit-bucket',
    'Published',
    false,
    array['Not Applicable'],
    array['Neutral bucket']
  ),
  (
    'Ribbon Wrap Top',
    'Crochet top',
    'A custom wrap top available in ocean, lime, and made-to-order colour directions.',
    'From R480',
    'ribbon-wrap-top',
    'Published',
    true,
    array['XS', 'Small', 'Medium', 'Large', 'XL', 'Custom Measurements'],
    array['Ocean', 'Lime', 'Custom colour']
  ),
  (
    'Spectrum Fringe',
    'Custom skirt piece',
    'A colourful fringe skirt designed for movement and occasion styling.',
    'From R890',
    'spectrum-fringe',
    'Published',
    false,
    array['XS', 'Small', 'Medium', 'Large', 'XL', 'Custom Measurements'],
    array['Spectrum fringe']
  )
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  description = excluded.description,
  price = excluded.price,
  status = excluded.status,
  is_featured = excluded.is_featured,
  available_sizing = excluded.available_sizing,
  available_colors = excluded.available_colors,
  updated_at = now();
