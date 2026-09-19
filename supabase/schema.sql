create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'seller', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'customer';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.sellers (
  id text primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  phone text not null default '',
  location text not null default '',
  delivery_fee numeric not null default 50,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sellers add column if not exists description text not null default '';
alter table public.sellers add column if not exists logo_url text not null default '';
alter table public.sellers add column if not exists banner_url text not null default '';
alter table public.sellers add column if not exists estate text not null default '';
alter table public.sellers add column if not exists opening_time text not null default '07:00';
alter table public.sellers add column if not exists closing_time text not null default '21:00';
alter table public.sellers add column if not exists pickup_available boolean not null default true;
alter table public.sellers add column if not exists delivery_available boolean not null default true;
alter table public.sellers add column if not exists minimum_order numeric not null default 0;
alter table public.sellers add column if not exists status text not null default 'approved' check (status in ('approved', 'pending', 'suspended'));
alter table public.sellers add column if not exists business_type text not null default '';
alter table public.sellers add column if not exists business_registration_number text not null default '';
alter table public.sellers add column if not exists whatsapp text not null default '';
alter table public.sellers add column if not exists categories text[] not null default '{}';
alter table public.sellers add column if not exists county text not null default '';
alter table public.sellers add column if not exists sub_county text not null default '';
alter table public.sellers add column if not exists landmark text not null default '';
alter table public.sellers add column if not exists location_notes text not null default '';
alter table public.sellers add column if not exists onboarding_step integer not null default 1;

-- Widen the status lifecycle to support draft onboarding and rejection,
-- without touching any existing 'approved' | 'pending' | 'suspended' rows.
alter table public.sellers drop constraint if exists sellers_status_check;
alter table public.sellers add constraint sellers_status_check check (status in ('draft', 'pending', 'approved', 'suspended', 'rejected'));

create table if not exists public.products (
  id text primary key,
  seller_id text references public.sellers(id) on delete cascade,
  seller_name text not null default '',
  seller_slug text not null default '',
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  price numeric not null default 0,
  original_price numeric not null default 0,
  discount_tag text not null default '',
  weight text not null default '',
  unit text not null default 'kg',
  minimum_quantity integer not null default 1,
  stock_quantity integer not null default 0,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  image_url text not null default '',
  category text not null default '',
  category_slug text not null default '',
  rating numeric not null default 0,
  reviews_count integer not null default 0,
  fast_delivery boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id text references public.sellers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  order_type text not null default 'delivery' check (order_type in ('delivery', 'pickup')),
  payment_method text not null default 'cash',
  delivery_address text not null default '',
  customer_phone text not null default '',
  notes text not null default '',
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

-- The cart intentionally supports fractional quantities, rounded to one decimal
-- (see lib/store/cart.ts), for weight-based items like "0.5 kg of tomatoes" — a
-- real, common grocery quantity, not a bug to round away. quantity must accept it.
alter table public.order_items alter column quantity type numeric using quantity::numeric;

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Verified buyer',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles (id, full_name, phone) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', '')); return new; end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  target_product text := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product_id = target_product), 0),
      reviews_count = (select count(*) from public.reviews r where r.product_id = target_product)
  where p.id = target_product;
  return null;
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change after insert or update or delete on public.reviews for each row execute procedure public.refresh_product_rating();

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() and not (old.role = 'customer' and new.role = 'seller') then
    raise exception 'Not allowed to change role to %', new.role;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_role_change on public.profiles;
create trigger on_profile_role_change before update of role on public.profiles for each row execute procedure public.prevent_role_escalation();

create or replace view public.seller_stats
with (security_invoker = true) as
select
  s.id as seller_id,
  coalesce(round(avg(r.rating)::numeric, 1), 0) as rating,
  count(r.id) as total_reviews,
  (select count(*) from public.orders o where o.seller_id = s.id) as total_orders
from public.sellers s
left join public.products p on p.seller_id = s.id
left join public.reviews r on r.product_id = p.id
group by s.id;

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.reviews enable row level security;

do $$ begin
  create policy "Anyone can read available products"
    on public.products for select
    using (is_available = true or auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated admins can manage products"
    on public.products for all
    using (public.is_admin())
    with check (public.is_admin());
exception when duplicate_object then null; end $$;

drop policy if exists "Public can read sellers" on public.sellers;
create policy "Public can read sellers" on public.sellers for select
  using (status not in ('draft', 'rejected') or owner_id = auth.uid() or public.is_admin());
do $$ begin create policy "Sellers apply for their own stall" on public.sellers for insert with check (owner_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Sellers manage their own stall" on public.sellers for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins delete sellers" on public.sellers for delete using (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Sellers manage their own products" on public.products for all using (exists (select 1 from public.sellers where id = seller_id and owner_id = auth.uid())) with check (exists (select 1 from public.sellers where id = seller_id and owner_id = auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can read their profile" on public.profiles for select using (id = auth.uid() or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update their profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users manage their addresses" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Customers read their orders" on public.orders for select using (customer_id = auth.uid() or public.is_admin() or exists (select 1 from public.sellers where id = seller_id and owner_id = auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "Customers create orders" on public.orders for insert with check (customer_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Order owners update status" on public.orders for update using (customer_id = auth.uid() or public.is_admin() or exists (select 1 from public.sellers where id = seller_id and owner_id = auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins delete orders" on public.orders for delete using (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Order participants read items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin() or exists (select 1 from public.sellers s where s.id = o.seller_id and s.owner_id = auth.uid())))); exception when duplicate_object then null; end $$;
do $$ begin create policy "Customers create items" on public.order_items for insert with check (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users manage favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Anyone can read reviews" on public.reviews for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Authenticated users write their reviews" on public.reviews for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users manage their reviews" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users delete their reviews" on public.reviews for delete using (auth.uid() = user_id or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users manage conversations" on public.assistant_conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users manage assistant messages" on public.assistant_messages for all using (exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid())) with check (exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid())); exception when duplicate_object then null; end $$;

do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.products; exception when duplicate_object then null; end $$;

-- Storage bucket for seller onboarding uploads (shop logo / banner).
-- Files are stored under "<owner_id>/<filename>" so a seller can only touch their own folder.
insert into storage.buckets (id, name, public)
values ('seller-assets', 'seller-assets', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Public read seller assets" on storage.objects for select
    using (bucket_id = 'seller-assets');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Sellers upload their own assets" on storage.objects for insert
    with check (bucket_id = 'seller-assets' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Sellers update their own assets" on storage.objects for update
    using (bucket_id = 'seller-assets' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'seller-assets' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Sellers delete their own assets" on storage.objects for delete
    using (bucket_id = 'seller-assets' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- ── Customer <-> seller chat ────────────────────────────────────────────────
-- One thread per (customer, seller) pair, reused across every product they
-- discuss; individual messages can carry a product snapshot so a message can
-- say "regarding this product" without a join back to a row that may change.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id text not null references public.sellers(id) on delete cascade,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  last_sender_role text not null default 'customer' check (last_sender_role in ('customer', 'seller')),
  customer_unread int not null default 0,
  seller_unread int not null default 0,
  created_at timestamptz not null default now(),
  unique (customer_id, seller_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'seller')),
  content text not null default '',
  product_id text references public.products(id) on delete set null,
  product_name text,
  product_image text,
  product_price numeric,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_created_idx on public.chat_messages(thread_id, created_at);
create index if not exists chat_threads_customer_idx on public.chat_threads(customer_id);
create index if not exists chat_threads_seller_idx on public.chat_threads(seller_id);

create or replace function public.sync_chat_thread_on_message()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.chat_threads
  set last_message = left(new.content, 200),
      last_message_at = new.created_at,
      last_sender_role = new.sender_role,
      customer_unread = case when new.sender_role = 'seller' then customer_unread + 1 else customer_unread end,
      seller_unread = case when new.sender_role = 'customer' then seller_unread + 1 else seller_unread end
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_chat_message_insert on public.chat_messages;
create trigger on_chat_message_insert after insert on public.chat_messages for each row execute procedure public.sync_chat_thread_on_message();

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

do $$ begin create policy "Thread participants read their thread" on public.chat_threads for select using (
  customer_id = auth.uid()
  or exists (select 1 from public.sellers s where s.id = seller_id and s.owner_id = auth.uid())
  or public.is_admin()
); exception when duplicate_object then null; end $$;

do $$ begin create policy "Customers start threads with a seller" on public.chat_threads for insert with check (customer_id = auth.uid()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Thread participants update their thread" on public.chat_threads for update using (
  customer_id = auth.uid()
  or exists (select 1 from public.sellers s where s.id = seller_id and s.owner_id = auth.uid())
  or public.is_admin()
) with check (
  customer_id = auth.uid()
  or exists (select 1 from public.sellers s where s.id = seller_id and s.owner_id = auth.uid())
  or public.is_admin()
); exception when duplicate_object then null; end $$;

do $$ begin create policy "Thread participants read messages" on public.chat_messages for select using (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (t.customer_id = auth.uid() or exists (select 1 from public.sellers s where s.id = t.seller_id and s.owner_id = auth.uid()) or public.is_admin())
  )
); exception when duplicate_object then null; end $$;

do $$ begin create policy "Thread participants send messages" on public.chat_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (t.customer_id = auth.uid() or exists (select 1 from public.sellers s where s.id = t.seller_id and s.owner_id = auth.uid()))
  )
); exception when duplicate_object then null; end $$;

do $$ begin create policy "Thread participants update message status" on public.chat_messages for update using (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (t.customer_id = auth.uid() or exists (select 1 from public.sellers s where s.id = t.seller_id and s.owner_id = auth.uid()) or public.is_admin())
  )
); exception when duplicate_object then null; end $$;

do $$ begin alter publication supabase_realtime add table public.chat_threads; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.chat_messages; exception when duplicate_object then null; end $$;

-- A seller normally can't read anything on a customer's profile row (RLS only allows
-- reading your own). Extend that narrowly: a seller may read the name/avatar/phone of a
-- customer they actually have a chat thread or an order with — needed to show a real
-- name/avatar/phone in the messages UI instead of nothing.
--
-- This MUST go through a security-definer function, not an inline subquery: an inline
-- subquery here re-enters RLS on chat_threads/orders while profiles' own RLS is already
-- being evaluated, and once anything else (like the blocked-customer check below) queries
-- profiles from within orders' RLS, that closes the loop — Postgres then refuses with
-- "infinite recursion detected in policy for relation orders". A security-definer function
-- bypasses RLS for its own internal queries (same reason is_admin() is one), breaking the cycle.
create or replace function public.seller_deals_with_customer(target_customer_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.chat_threads t join public.sellers s on s.id = t.seller_id where t.customer_id = target_customer_id and s.owner_id = auth.uid())
      or exists (select 1 from public.orders o join public.sellers s on s.id = o.seller_id where o.customer_id = target_customer_id and s.owner_id = auth.uid());
$$;

drop policy if exists "Sellers read profiles of customers they deal with" on public.profiles;
create policy "Sellers read profiles of customers they deal with" on public.profiles for select using (
  public.seller_deals_with_customer(profiles.id)
);

-- ── Admin: customer complaints ──────────────────────────────────────────────

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id text references public.sellers(id) on delete set null,
  subject text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  resolution_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_status_idx on public.complaints(status);
create index if not exists complaints_customer_idx on public.complaints(customer_id);

alter table public.complaints enable row level security;

do $$ begin create policy "Complaint participants read" on public.complaints for select using (
  customer_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.sellers s where s.id = seller_id and s.owner_id = auth.uid())
); exception when duplicate_object then null; end $$;

do $$ begin create policy "Customers file complaints" on public.complaints for insert with check (customer_id = auth.uid()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Admins resolve complaints" on public.complaints for update using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;

do $$ begin alter publication supabase_realtime add table public.complaints; exception when duplicate_object then null; end $$;

-- ── Admin: review reporting/moderation ──────────────────────────────────────

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

alter table public.review_reports enable row level security;

do $$ begin create policy "Users report reviews" on public.review_reports for insert with check (reporter_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins and reporters read reports" on public.review_reports for select using (reporter_id = auth.uid() or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins delete reports" on public.review_reports for delete using (public.is_admin()); exception when duplicate_object then null; end $$;

-- ── Admin: category taxonomy (was a static file — now admin-editable) ──────

create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null default 'salad',
  color text not null default '#dcfce7',
  priority text not null default 'Medium' check (priority in ('Very High', 'High', 'Medium', 'Later')),
  description text not null default '',
  subcategories jsonb not null default '[]'::jsonb,
  image_url text,
  sort_order int not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
do $$ begin create policy "Anyone can read visible categories" on public.categories for select using (is_hidden = false or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.categories; exception when duplicate_object then null; end $$;

-- ── Admin: service areas (was a static file — now admin-editable) ──────────

create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  country text not null default 'Kenya',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (name)
);

alter table public.service_areas enable row level security;
do $$ begin create policy "Anyone can read active service areas" on public.service_areas for select using (is_active = true or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins manage service areas" on public.service_areas for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;

-- ── Admin: customer blocking ─────────────────────────────────────────────

alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists admin_role text check (admin_role in ('super_admin', 'marketplace_manager', 'support_agent', 'finance_admin', 'content_manager'));

-- A blocked customer cannot place new orders (existing orders/history stay visible to admin).
-- This must be RESTRICTIVE: the existing "Customers create orders" permissive policy would
-- otherwise still allow the insert via OR, since Postgres ORs multiple permissive policies.
do $$ begin create policy "Blocked customers cannot create orders" on public.orders as restrictive for insert with check (
  not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_blocked = true)
); exception when duplicate_object then null; end $$;

-- ── Admin: finance — configurable commission + real refund tracking ────────

create table if not exists public.marketplace_settings (
  id boolean primary key default true check (id),
  commission_rate numeric not null default 0.10,
  updated_at timestamptz not null default now()
);
insert into public.marketplace_settings (id) values (true) on conflict (id) do nothing;

alter table public.marketplace_settings add column if not exists delivery_banner_text text not null default 'Free delivery on orders over KSh 1,500. Freshness delivered to your door.';
alter table public.marketplace_settings add column if not exists delivery_banner_enabled boolean not null default true;

alter table public.marketplace_settings enable row level security;
do $$ begin create policy "Anyone reads marketplace settings" on public.marketplace_settings for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins update marketplace settings" on public.marketplace_settings for update using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;

alter table public.orders add column if not exists refund_amount numeric not null default 0;
alter table public.orders add column if not exists refunded_at timestamptz;
-- Admin refund capability is already covered by the existing "Order owners update status"
-- policy, which includes public.is_admin() in its USING clause — no new policy needed.

-- ── Admin: marketplace-wide promotions ──────────────────────────────────────

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  discount_percent int not null check (discount_percent between 1 and 100),
  category_slug text,
  code text,
  starts_at date not null,
  ends_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promotions add column if not exists code text;
create unique index if not exists promotions_code_unique_idx on public.promotions (upper(code)) where code is not null;

alter table public.promotions enable row level security;
do $$ begin create policy "Anyone reads active promotions" on public.promotions for select using (is_active = true or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins manage promotions" on public.promotions for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.promotions; exception when duplicate_object then null; end $$;

-- ── Admin: marketplace announcements ────────────────────────────────────────

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
do $$ begin create policy "Anyone reads active announcements" on public.announcements for select using (is_active = true or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admins manage announcements" on public.announcements for all using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.announcements; exception when duplicate_object then null; end $$;

-- ── Admin: role-based permissions (RBAC) ────────────────────────────────────
-- admin_role sits on the same row a user can self-update via "Users can update
-- their profile" — without this guard anyone could grant themselves super_admin.
-- Mirrors prevent_role_escalation() for the same reason.

create or replace function public.prevent_admin_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.admin_role is distinct from old.admin_role and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.admin_role = 'super_admin'
  ) then
    raise exception 'Only a super admin can change admin roles';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_admin_role_change on public.profiles;
create trigger on_profile_admin_role_change before update of admin_role on public.profiles for each row execute procedure public.prevent_admin_role_escalation();

-- ── Multiple images per product ─────────────────────────────────────────────
-- products.image_url stays the single "cover" image every existing surface
-- (cards, cart, receipts, admin table) already reads — this table only adds
-- extra gallery photos for the product detail page, so nothing else changes.

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;
do $$ begin create policy "Anyone reads product images" on public.product_images for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Sellers and admins manage product images" on public.product_images for all using (
  public.is_admin() or exists (select 1 from public.products p join public.sellers s on s.id = p.seller_id where p.id = product_id and s.owner_id = auth.uid())
) with check (
  public.is_admin() or exists (select 1 from public.products p join public.sellers s on s.id = p.seller_id where p.id = product_id and s.owner_id = auth.uid())
); exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.product_images; exception when duplicate_object then null; end $$;

-- ── Live delivery tracking ───────────────────────────────────────────────
-- A seller sharing their location while out delivering writes it here. No new
-- RLS policy needed: "Order owners update status" already lets a seller update
-- any column on their own order, and "Customers read their orders" already
-- lets the customer read it back.
alter table public.orders add column if not exists seller_lat numeric;
alter table public.orders add column if not exists seller_lng numeric;
alter table public.orders add column if not exists seller_location_updated_at timestamptz;

-- ── Promo code redemption ────────────────────────────────────────────────
-- The discount is re-validated and recomputed server-side at order creation
-- (never trusted from the client), then stored here for the receipt/history.
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists discount_amount numeric not null default 0;