-- Seed data for the initial product catalog, mirrored from lib/mock-data.ts.
-- Safe to re-run: every insert upserts on primary key.
-- Product rating/reviews_count are NOT seeded directly — they are computed by the
-- on_review_change trigger from the reviews inserted at the bottom of this file.

insert into public.sellers (
  id, name, slug, phone, location, delivery_fee, is_open,
  description, banner_url, estate, opening_time, closing_time,
  pickup_available, delivery_available, minimum_order, status
)
values
  ('s1', 'GreenBasket Co.', 'mama-jane-fresh', '+254 712 345 678', 'Kasarani, Nairobi', 2.0, true,
   'Farm-fresh vegetables, herbs, and ripe fruits sourced every morning from organic local smallholders.',
   '/images/hero.jpg', '5th Eastfield Street, Near NY 10014', '07:00', '21:00', true, true, 10, 'approved'),
  ('s2', 'Mama Grace Fresh', 'mama-grace-fresh', '+254 722 987 654', 'Kasarani, Nairobi', 1.5, true,
   'Specialized in fresh local greens, indigenous produce, and seasonal sweet fruits.',
   '/images/hero.jpg', 'Kasarani Stage', '06:30', '20:30', true, true, 8, 'approved')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  phone = excluded.phone,
  location = excluded.location,
  delivery_fee = excluded.delivery_fee,
  is_open = excluded.is_open,
  description = excluded.description,
  banner_url = excluded.banner_url,
  estate = excluded.estate,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  pickup_available = excluded.pickup_available,
  delivery_available = excluded.delivery_available,
  minimum_order = excluded.minimum_order,
  status = excluded.status;

insert into public.products (
  id, seller_id, seller_name, seller_slug, name, subtitle, description,
  price, original_price, discount_tag, weight, unit, minimum_quantity,
  stock_quantity, is_available, is_featured, image_url, category, category_slug,
  fast_delivery
)
values
  ('p-strawberry', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Fresh Strawberry', '(Farm picked)',
   'Sweet, juicy hand-picked fresh organic strawberries. Rich in antioxidants and vitamin C, perfect for breakfasts, desserts, or fresh smoothies.',
   280, 330, '-15% OFF', '250 gm', 'punnet', 1, 50, true, true, '/images/products/strawberries.jpg', 'Fruits', 'fruits', true),

  ('p-orange', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Fresh Orange', '(Sweet Valencia)',
   'Juicy, sun-ripened Valencia oranges packed with natural citrus sweetness and vitamin C.',
   120, 150, '-20% OFF', '1 kg', 'kg', 1, 65, true, true, '/images/products/oranges.jpg', 'Fruits', 'fruits', true),

  ('p-banana', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Banana', '(Ripe & sweet)',
   'Naturally ripened sweet bananas, full of potassium and energy.',
   60, 80, '-25% OFF', '1 bunch', 'bunch', 1, 80, true, true, '/images/products/bananas.jpg', 'Fruits', 'fruits', true),

  ('p-green-apple', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Fresh Green Apple', '(Crisp Granny Smith)',
   'Crisp, tart, and extraordinarily refreshing Granny Smith green apples.',
   180, 230, '-22% OFF', '1 kg', 'kg', 1, 40, true, true, '/images/products/green_apple.jpg', 'Fruits', 'fruits', true),

  ('p-cabbage', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Cabbage', '(Crisp green head)',
   'Firm, tightly packed green cabbage head. Perfect for crisp salads or vegetable stir-fry.',
   45, 55, '-18% OFF', '1 head', 'head', 1, 45, true, true, '/images/products/cabbage.jpg', 'Vegetables', 'vegetables', true),

  ('p-tomato', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Fresh Tomatoes', '(Plump vine ripe)',
   'Succulent, deep-red vine-ripened tomatoes bursting with natural rich flavor.',
   80, 100, '-20% OFF', '1 kg', 'kg', 1, 90, true, true, '/images/products/tomatoes.jpg', 'Vegetables', 'vegetables', true),

  ('p-onion', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Fresh Onions', '(Dry cured red)',
   'Pungent, crisp red onions. Essential base for all aromatic Kenyan cooking.',
   70, 90, '-22% OFF', '1 kg', 'kg', 1, 85, true, true, '/images/products/onions.jpg', 'Vegetables', 'vegetables', true),

  ('p-avocado', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Avocado', '(Local Kenyan Hass)',
   'Creamy, nutrient-rich locally grown Hass avocados with a buttery texture. Great for guacamole and salads.',
   20, 25, '-20% OFF', '1 piece', 'piece', 1, 50, true, true, '/images/products/avocado.jpg', 'Fruits', 'fruits', true),

  ('p-beef', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Beef Mixed Cut', '(With bone)',
   '100% fresh marbled beef cuts with bone, perfect for Kenyan stew and broth.',
   650, 720, '-10% OFF', '1 kg', 'kg', 1, 28, true, true, '/images/products/beef.jpg', 'Meat', 'meats', true),

  ('p-kales', 's2', 'Mama Grace Fresh', 'mama-grace-fresh', 'Kales (Sukuma Wiki)', '(Tender farm-cut)',
   'Freshly harvested tender sukuma wiki kales. A Kenyan household staple, rich in iron and vitamins A and C.',
   30, 40, '-25% OFF', '1 bunch', 'bunch', 1, 120, true, true, '/kales.png', 'Vegetables', 'vegetables', true),

  ('p-sukuma', 's2', 'Mama Grace Fresh', 'mama-grace-fresh', 'Sukuma Wiki', '(Ready to cook)',
   'Pre-washed and chopped sukuma wiki, ready to cook straight from the packet. Fresh from the farm.',
   35, 45, '-22% OFF', '500 gm', 'packet', 1, 60, true, true, '/images/products/sukuma.jpg', 'Vegetables', 'vegetables', true),

  ('p-spinach', 's2', 'Mama Grace Fresh', 'mama-grace-fresh', 'Fresh Spinach', '(Baby leaf)',
   'Crisp, dark-green baby spinach leaves rich in iron and folate. Perfect for salads, stir-fries, and smoothies.',
   40, 55, '-27% OFF', '250 gm', 'bunch', 1, 75, true, true, '/spinnach.png', 'Vegetables', 'vegetables', true),

  ('p-green-pepper', 's2', 'Mama Grace Fresh', 'mama-grace-fresh', 'Green Pepper', '(Capsicum)',
   'Crisp, vibrant green capsicum peppers. Full of vitamin C, great for pilau, stews, and stir-fries.',
   50, 65, '-23% OFF', '500 gm', 'kg', 1, 55, true, true, '/green-pepper.png', 'Vegetables', 'vegetables', true),

  ('p-carrots', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Fresh Carrots', '(Farm fresh)',
   'Crunchy, sweet carrots freshly harvested. Loaded with beta-carotene and vitamin A.',
   60, 75, '-20% OFF', '1 kg', 'kg', 1, 95, true, true, '/images/products/carrots.jpg', 'Vegetables', 'vegetables', true),

  ('p-beetroot', 's1', 'GreenBasket Co.', 'mama-jane-fresh', 'Beetroot', '(Deep red, earthy)',
   'Rich, deep-red beetroot packed with nitrates for energy and heart health. Great for juicing and salads.',
   80, 100, '-20% OFF', '500 gm', 'packet', 1, 40, true, false, '/images/products/beetroot.jpg', 'Vegetables', 'vegetables', false)
on conflict (id) do update set
  seller_id = excluded.seller_id,
  seller_name = excluded.seller_name,
  seller_slug = excluded.seller_slug,
  name = excluded.name,
  subtitle = excluded.subtitle,
  description = excluded.description,
  price = excluded.price,
  original_price = excluded.original_price,
  discount_tag = excluded.discount_tag,
  weight = excluded.weight,
  unit = excluded.unit,
  minimum_quantity = excluded.minimum_quantity,
  stock_quantity = excluded.stock_quantity,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  image_url = excluded.image_url,
  category = excluded.category,
  category_slug = excluded.category_slug,
  fast_delivery = excluded.fast_delivery,
  updated_at = now();

-- Seed reviews (author_name only — no user_id, since these predate any real signups).
-- Inserting them fires on_review_change, which recomputes each product's rating/reviews_count.
delete from public.reviews where user_id is null and product_id in (
  'p-strawberry','p-orange','p-banana','p-green-apple','p-cabbage','p-tomato',
  'p-onion','p-avocado','p-beef','p-kales','p-sukuma','p-spinach','p-green-pepper',
  'p-carrots','p-beetroot'
);

insert into public.reviews (product_id, author_name, rating, comment)
values
  ('p-strawberry', 'Charlotte Wilson', 5, 'Very satisfied with this purchase. The strawberries were juicy, ripe, and delivered chilled in under 25 minutes.'),
  ('p-strawberry', 'Sophia Bennett', 5, 'Really happy with these fresh berries. High quality produce every single time.'),
  ('p-orange', 'Grace W.', 5, 'Sweet and juicy, exactly as described.'),
  ('p-banana', 'Peter O.', 5, 'Perfectly ripe, kids loved them.'),
  ('p-green-apple', 'Amina K.', 4, 'Crisp and tart, great for snacking.'),
  ('p-cabbage', 'Grace W.', 5, 'Firm head, lasted the whole week.'),
  ('p-tomato', 'Peter O.', 5, 'Vine-ripened flavor, best in the neighborhood.'),
  ('p-onion', 'Amina K.', 4, 'Good quality, slightly smaller than expected.'),
  ('p-avocado', 'Charlotte Wilson', 5, 'Creamy Hass avocados, perfect for guacamole.'),
  ('p-beef', 'Sophia Bennett', 4, 'Good marbling, arrived well packaged.'),
  ('p-kales', 'Grace W.', 5, 'Sukuma wiki was super fresh. Delivered in under 30 minutes!'),
  ('p-sukuma', 'Peter O.', 5, 'Pre-chopped and ready to cook, huge time saver.'),
  ('p-spinach', 'Amina K.', 5, 'Rich dark green leaves, very fresh.'),
  ('p-green-pepper', 'Charlotte Wilson', 4, 'Crisp capsicum, great for stir-fry.'),
  ('p-carrots', 'Sophia Bennett', 5, 'Sweet and crunchy, kids eat them raw.'),
  ('p-beetroot', 'Grace W.', 4, 'Earthy and fresh, great for juicing.');
