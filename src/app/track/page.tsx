"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { LoginModal } from '@/components/vivaan/LoginModal';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCart } from '@/hooks/use-cart';
import { collection, query, where } from 'firebase/firestore';
import { Package, Truck, CheckCircle2, Clock, ExternalLink, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrackOrderPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { totalQty } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [lastSavedTracking, setLastSavedTracking] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vivaan_last_tracking');
      if (saved) {
        setLastSavedTracking(saved);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Query orders by userId without composite orderBy to prevent Firestore index requirements
  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // Sort orders client-side by date descending
  const orders = useMemo(() => {
    if (!rawOrders || !Array.isArray(rawOrders)) return [];
    return [...rawOrders].sort((a, b) => {
      const timeA = a.createdAt?.seconds 
        ? a.createdAt.seconds * 1000 
        : new Date(a.orderDate || 0).getTime();
      const timeB = b.createdAt?.seconds 
        ? b.createdAt.seconds * 1000 
        : new Date(b.orderDate || 0).getTime();
      return timeB - timeA;
    });
  }, [rawOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'Shipped': return <Truck className="w-5 h-5 text-secondary" />;
      default: return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'shop') router.push('/category/ghee');
    else if (tab === 'cart') router.push('/checkout');
  };

  const handleTrackDirect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idToTrack = trackingInput.trim() || lastSavedTracking;
    if (!idToTrack) return;
    const url = `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(idToTrack)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06] pb-28 md:pb-0">
      <Ticker />
      <Header 
        onOpenCart={() => router.push('/checkout')} 
        cartCount={totalQty} 
        onFilter={(cat) => router.push(`/category/${cat}`)} 
        onSearch={() => router.push('/')} 
      />

      <main className="max-w-[1000px] mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-10 md:py-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-primary leading-tight">
            Track Your Package
          </h1>
          <p className="text-[#7A6848] text-xs sm:text-base font-medium mt-1">
            Real-time tracking for your farm-fresh deliveries via NimbusPost courier network.
          </p>
        </div>

        {/* ── 1. Direct AWB Tracking Card (Works for Guests & Logged-In Users) ── */}
        <div className="bg-white p-5 sm:p-7 rounded-[24px] sm:rounded-[32px] border border-primary/10 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-extrabold text-primary uppercase tracking-wider">
              Quick NimbusPost AWB Tracking
            </h2>
          </div>
          <form onSubmit={handleTrackDirect} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter NimbusPost Tracking ID / AWB Number..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="w-full h-12 sm:h-13 pl-11 pr-4 rounded-full border border-gray-200 text-xs sm:text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-all bg-[#FAF8F5]"
              />
            </div>
            <button
              type="submit"
              disabled={!trackingInput.trim() && !lastSavedTracking}
              className="h-12 sm:h-13 px-7 sm:px-8 bg-primary hover:bg-[#14482D] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Track Shipment</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </form>

          {lastSavedTracking && (
            <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-[#7A6848]">
              <span className="font-semibold">Recent Order AWB:</span>
              <button 
                type="button"
                onClick={() => {
                  setTrackingInput(lastSavedTracking);
                  window.open(`https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(lastSavedTracking)}`, '_blank', 'noopener,noreferrer');
                }} 
                className="inline-flex items-center gap-1 font-mono font-bold text-primary underline underline-offset-2 hover:text-[#14482D] cursor-pointer"
              >
                <span>{lastSavedTracking}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* ── 2. Order History Status ── */}
        {isUserLoading || ordersLoading ? (
          <div className="space-y-4 sm:space-y-6 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 sm:h-40 bg-white rounded-[22px] sm:rounded-[32px] border border-primary/5"></div>
            ))}
          </div>
        ) : !user ? (
          <div className="bg-white p-6 sm:p-10 md:p-12 rounded-[24px] sm:rounded-[40px] text-center border border-primary/5 shadow-md">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-2">Track With Your Account</h2>
            <p className="text-[#7A6848] text-xs sm:text-sm font-medium mb-6 max-w-md mx-auto">
              Sign in to view your complete order history, purity points, and live package status.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                onClick={() => setIsLoginOpen(true)} 
                className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-primary hover:bg-[#14482D] text-white rounded-full font-black uppercase tracking-widest active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer shadow-md"
              >
                Login Now
              </button>
              <Link 
                href="/category/ghee" 
                prefetch={true}
                className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 border border-primary/20 text-primary hover:bg-primary/5 rounded-full font-black uppercase tracking-widest active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer flex items-center justify-center"
              >
                Shop Pure Ghee
              </Link>
            </div>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-sm font-extrabold text-[#7A6848] uppercase tracking-[2px]">
                Your Order History ({orders.length})
              </h2>
            </div>
            {orders.map((order) => {
              const trackingUrl = order.trackingId 
                ? `https://ship.nimbuspost.com/shipping/tracking/${order.trackingId}`
                : null;

              return (
                <div key={order.id} className="bg-white rounded-[22px] sm:rounded-[32px] overflow-hidden border border-primary/5 shadow-md hover:shadow-xl transition-all">
                  <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-start md:items-center gap-3.5 sm:gap-5">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F9F6EF] rounded-xl sm:rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">
                          Order ID: #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-lg sm:text-xl font-headline font-black text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Placed on {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</div>
                        
                        {order.trackingId && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F9F6EF] border border-[#E8ECE9] rounded-md text-[10px] sm:text-[11px] font-extrabold text-primary">
                            <Truck className="w-3 h-3 text-secondary" />
                            <span>AWB: {order.trackingId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-2 md:pt-0 border-t border-[#F9F6EF] md:border-t-0">
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider",
                        order.status === 'Delivered' ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-700"
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status || 'Processing'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold">{order.paymentMethod || 'Prepaid'} · {order.paymentStatus || 'Paid'}</div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 border-t border-[#F9F6EF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[9px] sm:text-[10px]">🌿</div>
                        ))}
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[#7A6848] ml-1">Vivaan Farms Package</span>
                    </div>

                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 sm:px-6 bg-primary text-white text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-full hover:bg-secondary transition-all shadow-md active:scale-95 w-full sm:w-auto"
                      >
                        <Truck className="w-3.5 h-3.5 text-secondary" />
                        <span>Track Shipment</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 sm:px-6 bg-gray-100 text-gray-400 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-full cursor-not-allowed opacity-80 w-full sm:w-auto"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Tracking ID Pending</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-12 md:p-16 rounded-[24px] sm:rounded-[40px] text-center border border-primary/5 shadow-md">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-2">No orders placed yet</h2>
            <p className="text-muted-foreground font-medium text-xs sm:text-sm mb-6 max-w-md mx-auto">
              Start your wellness journey today with our authentic Vedic Gir Cow A2 Bilona Ghee and pure farm harvest.
            </p>
            <Link 
              href="/category/ghee" 
              prefetch={true}
              className="inline-flex items-center gap-2 h-12 sm:h-14 px-8 sm:px-10 bg-primary hover:bg-[#14482D] text-white rounded-full font-black uppercase tracking-widest active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer shadow-md"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav activeTab="account" onTabChange={handleTabChange} cartCount={totalQty} />
      
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
