import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Assistant from "@/components/Assistant";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { FavoritesProvider } from "@/lib/hooks/useFavorites";

export const metadata: Metadata = {
  title: "MamaFresh — Fresh from your neighborhood mama mboga",
  description:
    "Order fresh vegetables, fruits and groceries from mama mbogas and small produce sellers near you, across East Africa.",
  keywords: "mama mboga, fresh vegetables, groceries, Kenya, Uganda, Tanzania, Rwanda, East Africa",
  manifest: "/manifest.json",
  icons: {
    icon: "/favico.png",
    shortcut: "/favico.png",
    apple: "/favico.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MamaFresh",
  },
  openGraph: {
    title: "MamaFresh",
    description: "Fresh from your neighborhood mama mboga",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface font-sans antialiased">
        <FavoritesProvider>
          <div className="app-shell relative min-h-screen flex flex-col">
            <AnnouncementBanner />
            <Navbar />
            <main className="app-main flex-1 pb-nav">
              {children}
            </main>
            <Footer />
            <BottomNav />
            <Assistant />
            <CookieConsentBanner />
          </div>
        </FavoritesProvider>
      </body>
    </html>
  );
}
