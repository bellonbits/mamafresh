"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Zap,
  Star,
  Minus,
  Plus,
  Phone,
  MessageCircle,
  CheckCircle2,
  Check,
  Store,
  Search,
  Sparkles,
  UserRound,
  Flag,
  Truck,
} from "lucide-react";
import { getDefaultProductImage } from "@/lib/mock-data";
import { useCartStore } from "@/lib/store/cart";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { findOrCreateThread } from "@/lib/chat/startThread";
import FormattedPrice from "@/components/FormattedPrice";
import ProductCard from "@/components/ProductCard";
import { cn, formatKSh } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, SellerRow, ReviewRow } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

const WEIGHT_OPTIONS = [
  { label: "500 gm", multiplier: 0.5 },
  { label: "1000 gm", multiplier: 1 },
  { label: "1500 gm", multiplier: 1.5 },
  { label: "2000 gm", multiplier: 2 },
];

export default function ProductDetailsPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [reportedReviewIds, setReportedReviewIds] = useState<Set<string>>(new Set());
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: productData } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!active) return;
      if (!productData) {
        setNotFoundFlag(true);
        setLoading(false);
        return;
      }
      const p = productData as ProductRow;
      setProduct(p);

      const [{ data: sellerData }, { data: relatedData }, { data: reviewData }, { data: imageData }] = await Promise.all([
        p.seller_id ? supabase.from("sellers").select("*").eq("id", p.seller_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("products").select("*").neq("id", p.id).eq("is_available", true).limit(3),
        supabase.from("reviews").select("*").eq("product_id", p.id).order("created_at", { ascending: false }),
        supabase.from("product_images").select("url").eq("product_id", p.id).order("sort_order", { ascending: true }),
      ]);
      if (!active) return;
      setSeller(sellerData as SellerRow | null);
      setRelatedProducts((relatedData ?? []) as ProductRow[]);
      setReviews((reviewData ?? []) as ReviewRow[]);
      setGalleryUrls(Array.from(new Set([p.image_url, ...((imageData ?? []) as { url: string }[]).map((img) => img.url)].filter(Boolean))));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [id]);

  const { items, addItem, updateQty, getTotalItems } = useCartStore();
  const { favoriteIds, toggle, isSignedIn } = useFavorites();
  const cartItem = product ? items.find((i) => i.product.id === product.id) : undefined;
  const totalItems = getTotalItems();

  const [qty, setQty] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState("1000 gm");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [reviewTab, setReviewTab] = useState<"reviews" | "write">("reviews");
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [detailImgSrc, setDetailImgSrc] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      if (product) {
        setQty(cartItem?.quantity ?? 1);
        setDetailImgSrc(product.image_url || getDefaultProductImage(product.name, product.category));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const weightMult = WEIGHT_OPTIONS.find((w) => w.label === selectedWeight)?.multiplier ?? 1;
  const currentPrice = (product?.price ?? 0) * weightMult;
  const liked = product ? favoriteIds.has(product.id) : false;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : (product?.rating ?? 0);
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);

  const handleMinus = () => {
    if (!product) return;
    if (qty > 1) {
      const next = qty - 1;
      setQty(next);
      if (cartItem) updateQty(product.id, next);
    }
  };

  const handlePlus = () => {
    if (!product) return;
    const next = qty + 1;
    setQty(next);
    if (cartItem) updateQty(product.id, next);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, qty);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const handleChatWithSeller = async () => {
    if (!product || !seller || startingChat) return;
    setStartingChat(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/products/${product.id}`)}`);
        return;
      }
      const thread = await findOrCreateThread(user.id, seller.id);
      const query = new URLSearchParams({
        productId: product.id,
        productName: product.name,
        productImage: product.image_url,
        productPrice: String(currentPrice),
      });
      router.push(`/messages/${thread.id}?${query.toString()}`);
    } finally {
      setStartingChat(false);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (reportedReviewIds.has(reviewId)) return;
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    // A unique-constraint failure just means they already reported this review — treat that as success too.
    await supabase.from("review_reports").insert({ review_id: reviewId, reporter_id: user.id, reason: "Reported from product page" });
    setReportedReviewIds((current) => new Set(current).add(reviewId));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !product) return;
    setReviewError(null);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setReviewError("Sign in to leave a review.");
      return;
    }
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: product.id,
        user_id: user.id,
        author_name: user.user_metadata?.full_name || "Verified buyer",
        rating: newReviewRating,
        comment: newReviewText.trim(),
      })
      .select("*")
      .single();
    if (error) {
      setReviewError(error.message);
      return;
    }
    setReviews((current) => [data as ReviewRow, ...current]);
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewTab("reviews");
      setReviewSubmitted(false);
      setNewReviewText("");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F4]">
        <div className="text-sm font-bold text-gray-400">Loading product...</div>
      </div>
    );
  }

  if (notFoundFlag || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F3F4F4] p-6 text-center">
        <p className="text-lg font-black text-gray-800">Product not found</p>
        <Link href="/shops" className="rounded-full bg-[#073729] px-5 py-2.5 text-xs font-bold text-white">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F4] animate-fade-in relative flex flex-col">
      {/* ─────────────────────────────────────────────────────────── */}
      {/*  Top Header                                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#073729] px-5 py-2 text-center text-[10px] font-semibold tracking-wide text-emerald-100">
        Free delivery on orders over KSh 1,500. Freshness delivered to your door.
      </div>
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} aria-label="Go back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-[#073729] hover:border-[#84CC16]">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <Link href="/home" className="flex h-10 w-[110px] shrink-0 items-center sm:w-[132px]">
            <Image src="/logo.png" alt="MamaFresh" width={300} height={200} priority className="h-full w-full object-contain object-left" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 lg:flex">
            <Link href="/home" className="hover:text-[#16A34A]">Home</Link>
            <Link href="/shops" className="text-[#16A34A]">Shop</Link>
            <Link href="/offers" className="hover:text-[#16A34A]">Offers</Link>
            <Link href="/assistant" className="flex items-center gap-1 hover:text-[#16A34A]"><Sparkles size={14} className="text-current" /> MamaFresh AI</Link>
            <Link href="/about" className="hover:text-[#16A34A]">About</Link>
            <Link href="/contact" className="hover:text-[#16A34A]">Contact</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/search" aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600"><Search size={18} /></Link>
            <Link href="/favorites" aria-label="Favorites" className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 sm:flex"><Heart size={18} /></Link>
            <Link href="/cart" aria-label="View cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#073729]"><ShoppingCart size={18} />{totalItems > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84919] px-1 text-[9px] font-bold text-white">{Math.ceil(totalItems)}</span>}</Link>
            <Link href="/account" aria-label="Account" className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#073729] text-white sm:flex"><UserRound size={17} /></Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────── */}
      {/*  Curved White Sheet Container                               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto flex-1 w-full max-w-7xl bg-white pt-5 px-4 pb-36 shadow-xl relative sm:px-8 lg:rounded-2xl lg:my-8 lg:px-12 lg:pb-16 lg:grid lg:grid-cols-2 lg:gap-x-12">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 lg:hidden" />

        {/* Hero Product Image */}
        <div className="relative w-full h-72 my-2 flex items-center justify-center rounded-2xl bg-[#EAF7EE] lg:col-start-1 lg:row-start-1 lg:h-[460px]">
          <Image
            src={detailImgSrc}
            alt={product.name}
            fill
            priority
            className="object-contain p-6"
            sizes="(max-width: 480px) 100vw, 400px"
            onError={() => setDetailImgSrc(getDefaultProductImage(product.name, product.category))}
          />
          {galleryUrls.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {galleryUrls.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setDetailImgSrc(image)}
                  aria-label={`View product image ${index + 1}`}
                  className={cn("h-1.5 rounded-full transition-all", detailImgSrc === image ? "w-6 bg-[#16A34A]" : "w-1.5 bg-white border border-gray-200")}
                />
              ))}
            </div>
          )}
        </div>

        {galleryUrls.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 lg:col-start-1 lg:row-start-2">
            {galleryUrls.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setDetailImgSrc(image)}
                className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-[#F8FAFB]", detailImgSrc === image ? "border-[#168255] ring-1 ring-[#168255]" : "border-gray-200")}
                aria-label={`View product image ${index + 1}`}
              >
                <Image src={image} alt="" fill className="object-contain p-1" sizes="64px" />
              </button>
            ))}
          </div>
        )}

        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:flex lg:flex-col lg:justify-center">
        {/* Product Title & Heart Icon Row */}
        <div className="mt-6 flex items-start justify-between gap-3 lg:mt-0">
          <div>
            <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
              {product.category}
            </span>
            <h2 className="text-xl font-extrabold text-[#073729] leading-tight tracking-tight mt-0.5">
              {product.name}
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {product.subtitle || "In 50 gm portions"}
            </p>
          </div>

          <button
            onClick={() => toggle(product.id)}
            disabled={!isSignedIn}
            aria-label="Save to favorites"
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 active:scale-90 transition-all flex-shrink-0"
          >
            <Heart
              size={18}
              strokeWidth={2}
              className={liked ? "fill-red-500 text-red-500" : "text-gray-500"}
            />
          </button>
        </div>

        {/* Weight Selection Pills (from design system) */}
        <div className="mt-4">
          <p className="text-xs font-bold text-gray-700 mb-2">Select Portion / Weight:</p>
          <div className="grid grid-cols-4 gap-2">
            {WEIGHT_OPTIONS.map((opt) => {
              const isSel = selectedWeight === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => setSelectedWeight(opt.label)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold transition-all active:scale-95 text-center border",
                    isSel
                      ? "bg-[#073729] text-white border-[#073729] shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details / Support / Ratings quick-nav */}
        <div className="mt-4 flex items-center gap-6 border-b border-gray-100 pb-2 text-xs font-bold text-gray-400">
          <span className="text-[#16A34A]">Details</span>
          {seller && (
            <button type="button" onClick={() => document.getElementById("seller-support")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="hover:text-[#073729]">
              Support
            </button>
          )}
          <button type="button" onClick={() => document.getElementById("product-ratings")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="hover:text-[#073729]">
            Ratings
          </button>
        </div>

        {/* Price */}
        <div className="mt-4">
          <FormattedPrice price={currentPrice} size="xl" />
        </div>

        {/* Delivery Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {product.fast_delivery && (
            <div className="flex items-center gap-1.5 bg-[#F3E8FF] text-[#7E22CE] px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xs">
              <Zap size={13} className="fill-[#7E22CE]" />
              <span>25-35 mins fast delivery</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#EAF7EE] text-[#16A34A] px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xs">
            <Truck size={13} />
            <span>Free delivery over KSh 1,500</span>
          </div>
        </div>

        {/* Store Contact Card (Design system) */}
        {seller && (
        <div id="seller-support" className="mt-4 bg-[#F8FAF9] border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAF7EE] text-[#073729] flex items-center justify-center">
              <Store size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Sold by</p>
              <Link href={`/shops/${seller.slug}`} className="text-sm font-extrabold text-[#073729] hover:underline">
                {seller.name}
              </Link>
              <p className="text-[11px] text-gray-400">{seller.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${seller.phone}`}
              aria-label="Call seller"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:text-[#16A34A] transition-colors"
            >
              <Phone size={14} />
            </a>
            <a
              href={`https://wa.me/${seller.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(seller.name)},%20I%20am%20inquiring%20about%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp seller"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:text-[#16A34A] transition-colors"
            >
              <MessageCircle size={14} />
            </a>
            <button
              type="button"
              onClick={() => void handleChatWithSeller()}
              disabled={startingChat}
              className="flex items-center gap-1.5 rounded-full bg-[#073729] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[#0B3D2E] transition-colors disabled:opacity-60"
            >
              <MessageCircle size={13} />
              {startingChat ? "Opening..." : "Chat to confirm"}
            </button>
          </div>
        </div>
        )}

        {/* Guarantee Description */}
        <div className="mt-4 text-xs text-gray-500 leading-relaxed font-normal">
          <p>
            100% satisfaction guarantee. If you experience any of the following issues,
            missing, poor item, late arrival, unprofessional servic
            {!showFullDesc && "..."}
            {showFullDesc ? (
              <span>
                ice, or order mismatches, our customer protection promise ensures instant
                free replacement or full refund without question.
              </span>
            ) : null}
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-[#073729] font-bold ml-1 hover:underline inline"
            >
              {showFullDesc ? "Show less" : "Read more"}
            </button>
          </p>
        </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/*  Customer Reviews Section (from design system)              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div id="product-ratings" className="mt-10 pt-5 border-t border-gray-100 lg:col-span-2 lg:row-start-6 lg:mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#073729]">Customer Reviews</h3>
              <p className="text-xs text-gray-400">Verified buyer feedback & ratings</p>
            </div>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-full text-xs font-bold">
              <button
                onClick={() => setReviewTab("reviews")}
                className={cn(
                  "px-3 py-1 rounded-full transition-all",
                  reviewTab === "reviews" ? "bg-white text-[#073729] shadow-xs" : "text-gray-500"
                )}
              >
                Reviews
              </button>
              <button
                onClick={() => setReviewTab("write")}
                className={cn(
                  "px-3 py-1 rounded-full transition-all",
                  reviewTab === "write" ? "bg-white text-[#073729] shadow-xs" : "text-gray-500"
                )}
              >
                Write
              </button>
            </div>
          </div>

          {reviewTab === "reviews" ? (
            <div>
              {/* Rating Summary Breakdown */}
              <div className="flex items-center gap-5 p-3.5 bg-[#F8FAF9] rounded-2xl mb-4">
                <div className="text-center flex-shrink-0">
                  <span className="text-3xl font-black text-[#073729]">{avgRating.toFixed(1)}</span>
                  <div className="flex items-center justify-center text-amber-400 gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-1">({reviews.length} Reviews)</span>
                </div>

                {/* Progress bars */}
                <div className="flex-1 space-y-1 text-[11px] text-gray-500">
                  {[5, 4, 3, 2, 1].map((star, idx) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-2">{star}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: reviews.length ? `${(ratingCounts[idx] / reviews.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Items List */}
              {reviews.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No reviews yet. Be the first to share your experience.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-gray-100 pb-3 last:border-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{rev.author_name}</span>
                          {rev.user_id && (
                            <span className="text-[10px] text-[#16A34A] font-semibold flex items-center gap-0.5">
                              <Check size={10} strokeWidth={3} /> Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5 my-1">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                      <button
                        type="button"
                        onClick={() => void handleReportReview(rev.id)}
                        disabled={reportedReviewIds.has(rev.id)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-red-500 disabled:text-red-400"
                      >
                        <Flag size={10} /> {reportedReviewIds.has(rev.id) ? "Reported" : "Report"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              {reviewError && <p className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-semibold text-red-700">{reviewError}</p>}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Your rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewReviewRating(num)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border transition-all",
                        newReviewRating >= num
                          ? "bg-amber-400 text-white border-amber-400"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Your review</label>
                <textarea
                  rows={3}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="How was the freshness, taste, or portion size?"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#073729] text-white text-xs font-bold hover:bg-[#0B3D2E] transition-colors"
              >
                {reviewSubmitted ? "Review Posted!" : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Related Products */}
        <div className="mt-8 pt-5 border-t border-gray-100 lg:col-span-2 lg:row-start-7">
          <h3 className="text-base font-extrabold text-[#073729] mb-3">You might also like</h3>
          <div className="grid grid-cols-3 gap-2">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {addedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#073729] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce-in">
          <CheckCircle2 size={16} className="text-[#84CC16]" />
          <span>Added {qty} item(s) to cart!</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/*  Bottom Sticky Action Bar                                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="above-bottom-nav fixed left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white/95 backdrop-blur-md px-5 py-3.5 border-t border-gray-100 flex items-center gap-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:rounded-t-2xl">
        {/* Quantity Stepper Capsule */}
        <div className="bg-white border border-gray-200 rounded-full px-2 py-1.5 flex items-center gap-3 shadow-xs">
          <button
            onClick={handleMinus}
            aria-label="Decrease quantity"
            className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm active:scale-90 transition-transform"
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-sm text-[#073729] min-w-3 text-center">
            {qty}
          </span>
          <button
            onClick={handlePlus}
            aria-label="Increase quantity"
            className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm active:scale-90 transition-transform"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Add to Cart CTA Button with Price */}
        <button
          onClick={handleAddToCart}
          className="flex-1 py-3 px-6 rounded-full bg-[#84CC16] hover:bg-[#65A30D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(132,204,22,0.4)] active:scale-98 transition-all"
        >
          <ShoppingCart size={17} strokeWidth={2.5} />
          <span>Add item · {formatKSh(currentPrice * qty)}</span>
        </button>
      </div>
    </div>
  );
}
