alter table public.marketplace_settings add column if not exists delivery_banner_text text not null default 'Free delivery on orders over KSh 1,500. Freshness delivered to your door.';
alter table public.marketplace_settings add column if not exists delivery_banner_enabled boolean not null default true;
