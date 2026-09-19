import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { usePathname } from "@/lib/next-compat/navigation";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer, { isFooterHidden } from "@/components/Footer";
import Assistant from "@/components/Assistant";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import SplashScreen from "@/components/SplashScreen";
import { FavoritesProvider } from "@/lib/hooks/useFavorites";
import { ONBOARDING_SEEN_KEY } from "@/lib/onboarding";

import WelcomePage from "@/pages/WelcomePage";
import HomePage from "@/pages/HomePage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import ContactPage from "@/pages/ContactPage";
import HelpPage from "@/pages/HelpPage";
import LocationPage from "@/pages/LocationPage";
import OffersPage from "@/pages/OffersPage";
import SearchPage from "@/pages/SearchPage";
import ShopsPage from "@/pages/ShopsPage";
import ShopDetailPage from "@/pages/ShopDetailPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import FavoritesPage from "@/pages/FavoritesPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import AccountPage from "@/pages/AccountPage";
import MessagesPage from "@/pages/MessagesPage";
import MessageThreadPage from "@/pages/MessageThreadPage";
import AssistantPage from "@/pages/AssistantPage";
import DeliveriesPage from "@/pages/DeliveriesPage";
import DeliveryShareLocationPage from "@/pages/DeliveryShareLocationPage";

// How long the branded splash shows on cold launch, before the real app
// underneath (already mounting in the background) takes over.
const SPLASH_DURATION_MS = 6000;

function hasSeenOnboarding() {
  try { return window.localStorage.getItem(ONBOARDING_SEEN_KEY) === "true"; } catch { return false; }
}

export default function App() {
  // Splash is part of the same first-launch experience as onboarding — it
  // shows once, alongside the onboarding carousel, then never again on
  // later app opens.
  const [showSplash, setShowSplash] = useState(() => !hasSeenOnboarding());

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <BrowserRouter>
      <FavoritesProvider>
        {showSplash && <SplashScreen />}
        <AppShell />
      </FavoritesProvider>
    </BrowserRouter>
  );
}

function AppShell() {
  const pathname = usePathname();
  // <main> only needs its own bottom padding to clear the fixed BottomNav on
  // routes where Footer is hidden — everywhere else, Footer sits between
  // <main> and BottomNav and its own bottom padding already does that job,
  // so padding <main> too would just add blank space above the footer.
  const footerHidden = isFooterHidden(pathname);

  return (
        <div className="app-shell relative min-h-screen flex flex-col">
          <AnnouncementBanner />
          <Navbar />
          <main className={cn("app-main", footerHidden && "pb-nav")}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/location" element={<LocationPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/shops/:slug" element={<ShopDetailPage />} />
              <Route path="/sellers" element={<Navigate to="/shops" replace />} />
              <Route path="/sellers/:slug" element={<RedirectToShop />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:slug" element={<CategoryDetailPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:threadId" element={<MessageThreadPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/deliver" element={<DeliveriesPage />} />
              <Route path="/deliver/:id" element={<DeliveryShareLocationPage />} />

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
          <Assistant />
          <CookieConsentBanner />
        </div>
  );
}

function RedirectToShop() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/shops/${slug}`} replace />;
}
