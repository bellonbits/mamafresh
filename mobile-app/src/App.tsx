import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { usePathname } from "@/lib/next-compat/navigation";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Assistant from "@/components/Assistant";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { FavoritesProvider } from "@/lib/hooks/useFavorites";

import WelcomePage from "@/pages/WelcomePage";
import HomePage from "@/pages/HomePage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AboutPage from "@/pages/AboutPage";
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

export default function App() {
  return (
    <BrowserRouter>
      <FavoritesProvider>
        <AppShell />
      </FavoritesProvider>
    </BrowserRouter>
  );
}

function AppShell() {
  const pathname = usePathname();
  // Onboarding is a standalone, full-screen experience with no app chrome
  // around it, so it shouldn't reserve space for the (hidden) bottom nav either.
  const isOnboarding = pathname === "/welcome";

  return (
        <div className="app-shell relative min-h-screen flex flex-col">
          <AnnouncementBanner />
          <Navbar />
          <main className={cn("app-main flex-1", !isOnboarding && "pb-nav")}>
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
