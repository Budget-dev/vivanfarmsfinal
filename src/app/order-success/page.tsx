"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Truck, Copy, Check, Coins, Package, Clock } from 'lucide-react';

export default function OrderSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const lastOrderId = localStorage.getItem('vivaan_last_order_id');
    if (lastOrderId) {
      setOrderId(lastOrderId);
    }
    const lastTracking = localStorage.getItem('vivaan_last_tracking');
    if (lastTracking) {
      setTrackingId(lastTracking);
    }
    const coins = localStorage.getItem('vivaan_last_earned_coins');
    if (coins) {
      setEarnedCoins(Number(coins));
      localStorage.removeItem('vivaan_last_earned_coins');
    }
  }, []);

  const copyToClipboard = () => {
    const textToCopy = orderId || trackingId;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinish = () => {
    clearCart();
    if (orderId) {
      router.push(`/track?orderId=${encodeURIComponent(orderId)}`);
    } else {
      router.push('/track');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06]">
      <Header onOpenCart={() => { }} cartCount={0} onSearch={() => { }} onFilter={() => { }} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-14 md:py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 sm:mb-10 animate-bounce">
          <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
        </div>

        <h1 className="font-headline text-3xl sm:text-5xl md:text-7xl font-extrabold text-primary mb-3 sm:mb-4 leading-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-sm sm:text-lg text-[#7A6848] font-medium max-w-2xl mb-8 sm:mb-10">
          Thank you for choosing pure Vedic farm harvest. Your order is confirmed and our farm team has begun fresh packing.
        </p>

        {orderId && (
          <div className="bg-white border-2 border-primary/10 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 mb-8 sm:mb-12 w-full max-w-lg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 sm:p-4">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 text-primary/10 rotate-[-15deg]" />
            </div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[3px] mb-2">Order Reference ID</div>
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <div className="text-xl sm:text-2xl md:text-3xl font-headline font-black text-primary break-all">#{orderId.toUpperCase()}</div>
              <button
                onClick={copyToClipboard}
                title="Copy order ID"
                className="w-10 h-10 rounded-full bg-[#F9F6EF] flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shrink-0 active:scale-90 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-primary" />}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-[11px] text-[#7A6848] font-bold uppercase tracking-wider">
                Status: Processing & Farm Packing
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl mb-10 sm:mb-16">
          <div className="bg-white p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] border border-primary/5 shadow-xl text-center">
            <Coins className="w-8 h-8 sm:w-10 sm:h-10 text-secondary mb-3 mx-auto" />
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Purity Rewards Earned</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">+{earnedCoins} Coins</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Credited automatically upon delivery</span>
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] border border-primary/5 shadow-xl text-center">
            <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-secondary mb-3 mx-auto" />
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Estimated Delivery</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">3-5 Days</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Direct Fresh Harvest Shipping</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none">
          <Button onClick={handleFinish} className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 bg-primary hover:bg-secondary text-white rounded-full font-black uppercase tracking-[2px] sm:tracking-[3px] shadow-xl active:scale-95 transition-transform min-h-[48px] cursor-pointer">
            Track My Order <Truck className="w-5 h-5 ml-2" />
          </Button>
          <Button onClick={() => { clearCart(); router.push('/'); }} variant="outline" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 rounded-full font-black uppercase tracking-[2px] sm:tracking-[3px] border-primary/20 hover:bg-primary/5 active:scale-95 transition-transform min-h-[48px] cursor-pointer">
            Back to Home
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
