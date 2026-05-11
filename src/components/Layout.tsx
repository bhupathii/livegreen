import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "./Toast";
import ScrollToTop from "./ScrollToTop";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isStandaloneRoute = location.pathname.startsWith("/admin") || location.pathname === "/scanme";

  return (
    <CartProvider>
      <WishlistProvider>
        <ToastProvider>
          <div className="flex min-h-screen flex-col font-sans text-[#051C06] bg-[#FCF9F1] dark:bg-[#0A1F0B] dark:text-[#CDDBCE] transition-colors duration-300">
            {!isStandaloneRoute && <Navbar />}
            <main className="flex-1">{children}</main>
            {!isStandaloneRoute && <Footer />}
          </div>
          <ScrollToTop />
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
