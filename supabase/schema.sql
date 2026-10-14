-- KYO clothing store: initial Supabase schema
-- Run this in Supabase Dashboard > SQL Editor.
-- Product photos belong in a Storage bucket named "product-images".

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null check (category in ('T-shirts', 'Hoodies', 'Chaquetas', 'Pantalones', 'Accesorios')),
  price numeric(10,2) not null check (price >= 0),
  image_url text not null,
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public can read active products; only authenticated admins can mutate products.
-- Add the admin role claim via a trusted server-side process / Supabase custom claims.
create policy "Anyone can read active products"
on public.products for select
using (active = true);

-- Admin writes are intentionally not enabled until an admin-role strategy is configured.
-- Do not add a broad "authenticated can write" policy for this table.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Public storefront images can be viewed without login.
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Storage upload/update/delete policies should be added after the admin role strategy
-- is configured. Keep them closed for now instead of allowing every signed-in user.
