"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCcw, ArrowRight } from 'lucide-react';

export default function OrderFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06]">
      <Header onOpenCart={() => {}} cartCount={0} onSearch={() => {}} onFilter={() => {}} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-14 md:py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6 sm:mb-10">
          <XCircle className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>

        <h1 className="font-headline text-3xl sm:text-5xl md:text-7xl font-extrabold text-primary mb-4 sm:mb-6 leading-tight">Payment Failed</h1>
        <p className="text-base sm:text-xl text-[#7A6848] font-medium max-w-2xl mb-8 sm:mb-12">
          Oops! Something went wrong with your transaction. Don&apos;t worry, your cart is still safe. Please try again or use a different payment method.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none">
          <Button onClick={() => router.push('/payment')} className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 bg-primary hover:bg-secondary text-white rounded-full font-black uppercase tracking-[2px] sm:tracking-[3px] shadow-xl active:scale-95 transition-transform min-h-[48px]">
            Retry Payment <RefreshCcw className="w-5 h-5 ml-2" />
          </Button>
          <Button onClick={() => router.push('/checkout')} variant="outline" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 rounded-full font-black uppercase tracking-[2px] sm:tracking-[3px] border-primary/20 hover:bg-primary/5 active:scale-95 transition-transform min-h-[48px]">
            Review Cart & Address
          </Button>
          <Button onClick={() => router.push('/')} variant="ghost" className="w-full sm:w-auto h-14 sm:h-16 px-6 rounded-full font-bold uppercase tracking-wider text-primary hover:bg-primary/5">
            Back to Shop
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
