import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Users, Package, FileText, Ticket, MessageSquare, Star, Gift, LogOut, ArrowLeft, Settings as SettingsIcon, Globe, Video, Bell, History, Mail, Database } from "lucide-react";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { CustomersTab } from "@/components/admin/CustomersTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { BlogsTab } from "@/components/admin/BlogsTab";
import { PromoCodesTab } from "@/components/admin/PromoCodesTab";
import { InquiriesTab } from "@/components/admin/InquiriesTab";
import { ReviewsTab } from "@/components/admin/ReviewsTab";
import { ReferralsTab } from "@/components/admin/ReferralsTab";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { useAuth } from "@/context/AuthContext";
import { SettingsPage } from "@/components/admin/SettingsPage";
import { GoogleReviewsTab } from "@/components/admin/GoogleReviewsTab";
import VideoTestimonialsTab from "@/components/admin/VideoTestimonialsTab";
import { SubscriptionsTab } from "@/components/admin/SubscriptionsTab";
import { AuditLogTab } from "@/components/admin/AuditLogTab";
import { EmailCampaignsTab } from "@/components/admin/EmailCampaignsTab";
import { Button } from "@/components/ui/button";

type TabId = 'dashboard' | 'orders' | 'customers' | 'products' | 'blogs' | 'promos' | 'inquiries' | 'reviews' | 'google-reviews' | 'video-testimonials' | 'referrals' | 'subscriptions' | 'audit-log' | 'email-campaigns';

export default function Admin() {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'blogs', label: 'Blogs', icon: FileText },
    { id: 'promos', label: 'Promo Codes', icon: Ticket },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'google-reviews', label: 'Google Reviews', icon: Globe },
    { id: 'video-testimonials', label: 'Video Testimonials', icon: Video },
    { id: 'referrals', label: 'Referrals', icon: Gift },
    { id: 'subscriptions', label: 'Subscriptions', icon: FileText },
    { id: 'email-campaigns', label: 'Email Campaigns', icon: Mail },
    { id: 'audit-log', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  if (!isAuthenticated) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#1B5E20] text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="font-serif text-xl font-bold">LGH Admin</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white hover:bg-white/10 px-2 min-w-0" title="Back to Store">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white hover:bg-white/10 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-[#1B5E20] text-white flex flex-col fixed h-full z-40 shadow-xl shadow-green-900/20 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex top-0 left-0 overflow-hidden`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#144a18]">
          <h1 className="font-serif text-2xl font-bold">LGH Admin</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white hover:bg-white/10 px-2 min-w-0 md:flex hidden" title="Back to Store">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <nav data-lenis-prevent className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${activeTab === item.id
                  ? "bg-white text-[#1B5E20] font-bold shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-[#1B5E20]" : "text-white/60"}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#144a18]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-4 sm:p-6 md:p-10 transition-all duration-300 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'blogs' && <BlogsTab />}
          {activeTab === 'promos' && <PromoCodesTab />}
          {activeTab === 'inquiries' && <InquiriesTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'google-reviews' && <GoogleReviewsTab />}
          {activeTab === 'video-testimonials' && <VideoTestimonialsTab />}
          {activeTab === 'referrals' && <ReferralsTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
          {activeTab === 'audit-log' && <AuditLogTab />}
          {activeTab === 'email-campaigns' && <EmailCampaignsTab />}
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
