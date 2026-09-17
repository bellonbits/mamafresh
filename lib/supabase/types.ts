export type ProductRow = {
  id: string;
  seller_id: string | null;
  seller_name: string;
  seller_slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  original_price: number;
  discount_tag: string;
  weight: string;
  unit: string;
  minimum_quantity: number;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  image_url: string;
  category: string;
  category_slug: string;
  rating: number;
  reviews_count: number;
  fast_delivery: boolean;
  updated_at: string;
};

export type SellerStatus = "draft" | "pending" | "approved" | "suspended" | "rejected";

export type SellerRow = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  phone: string;
  location: string;
  delivery_fee: number;
  is_open: boolean;
  description: string;
  logo_url: string;
  banner_url: string;
  estate: string;
  opening_time: string;
  closing_time: string;
  pickup_available: boolean;
  delivery_available: boolean;
  minimum_order: number;
  status: SellerStatus;
  business_type: string;
  business_registration_number: string;
  whatsapp: string;
  categories: string[];
  county: string;
  sub_county: string;
  landmark: string;
  location_notes: string;
  onboarding_step: number;
  created_at: string;
};

export type SellerStats = {
  seller_id: string;
  rating: number;
  total_reviews: number;
  total_orders: number;
};

export type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderRow = {
  id: string;
  customer_id: string;
  seller_id: string | null;
  status: OrderStatus;
  order_type: "delivery" | "pickup";
  payment_method: string;
  delivery_address: string;
  customer_phone: string;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  refund_amount: number;
  refunded_at: string | null;
  seller_lat: number | null;
  seller_lng: number | null;
  seller_location_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type CartOrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type AdminRole = "super_admin" | "marketplace_manager" | "support_agent" | "finance_admin" | "content_manager";

export type SubcategoryItem = {
  id: string;
  name: string;
  slug: string;
  items: string[];
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  priority: "Very High" | "High" | "Medium" | "Later";
  description: string;
  subcategories: SubcategoryItem[];
  image_url: string | null;
  sort_order: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceAreaRow = {
  id: string;
  name: string;
  city: string;
  country: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type MarketplaceSettingsRow = {
  id: true;
  commission_rate: number;
  updated_at: string;
};

export type PromotionRow = {
  id: string;
  title: string;
  discount_percent: number;
  category_slug: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  created_at: string;
};

export type ChatRole = "customer" | "seller";
export type ChatMessageStatus = "sent" | "delivered" | "read";

export type ChatThreadRow = {
  id: string;
  customer_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
  last_sender_role: ChatRole;
  customer_unread: number;
  seller_unread: number;
  created_at: string;
};

export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type ComplaintRow = {
  id: string;
  order_id: string | null;
  customer_id: string;
  seller_id: string | null;
  subject: string;
  description: string;
  status: ComplaintStatus;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
};

export type ReviewReportRow = {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: ChatRole;
  content: string;
  product_id: string | null;
  product_name: string | null;
  product_image: string | null;
  product_price: number | null;
  status: ChatMessageStatus;
  created_at: string;
};
