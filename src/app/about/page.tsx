"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { useCart } from '@/hooks/use-cart';
import { AboutSection3 } from '@/components/vivaan/AboutSection3';

export default function AboutPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, totalQty } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'shop') {
      router.push('/category/all');
    } else if (tab === 'cart') {
      setIsCartOpen(true);
    } else if (tab === 'account') {
      router.push('/track');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#100C06] pb-24 md:pb-0 font-sans">
      <div className="sticky top-0 z-[900]">
        <Ticker />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          cartCount={totalQty}
          onFilter={(cat) => router.push(`/category/${cat}`)}
          onSearch={() => router.push('/category/all')}
        />
      </div>

      <main>
        <AboutSection3 />
      </main>

      <Footer />
      
      <BottomNav activeTab="" onTabChange={handleTabChange} cartCount={totalQty} />

      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => { setIsCartOpen(false); router.push('/checkout'); }}
      />
    </div>
  );
}

