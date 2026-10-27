"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/vivaan/Header';
import { Ticker } from '@/components/vivaan/Ticker';
import { FestiveHero } from '@/components/vivaan/FestiveHero';
import { CleanestPantrySection } from '@/components/vivaan/CleanestPantrySection';
import { NativeIngredientsSection } from '@/components/vivaan/NativeIngredientsSection';
import { FocusGheeSection } from '@/components/vivaan/FocusGheeSection';
import { FocusSweetsSection } from '@/components/vivaan/FocusSweetsSection';
import { FocusHoneySection } from '@/components/vivaan/FocusHoneySection';
import { QualityAssuranceSection } from '@/components/vivaan/QualityAssuranceSection';
import { FarmJourneySection } from '@/components/product/FarmJourneySection';
import { CustomerReviewsSection } from '@/components/vivaan/CustomerReviewsSection';
import { CertificationsStrip } from '@/components/vivaan/CertificationsStrip';
import { Footer } from '@/components/vivaan/Footer';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { Product } from '@/types';
import { useCart } from '@/hooks/use-cart';
import { naturalLanguageProductSearch } from '@/ai/flows/natural-language-product-search';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function VivaanFarms() {
  const router = useRouter();
  const db = useFirestore();
  
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: dbProducts } = useCollection(productsRef);

  const [activeTab, setActiveTab] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { cart, addToCart, updateQty, removeFromCart, totalQty } = useCart();

  const products = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    
    return dbProducts
      .filter(p => p.isLive !== false)
      .map((p, i) => {
        const catId = (p.categoryId || p.cat || 'uncategorized').toLowerCase();
        const basePrice = Number(p.basePrice) || Number(p.price) || 0;
        
        return {
          ...p,
          cat: catId,
          price: basePrice,
          mrpPrice: Number(p.mrpPrice) || basePrice,
          vol: p.vol || (Array.isArray(p.vars) && p.vars.find((v: any) => v.on)?.s) || (p.volumeValue ? `${p.volumeValue}${p.volumeUnit || ''}` : 'Standard'),
          pi: i,
          rating: Number(p.rating) || 4.9,
          reviewCount: Number(p.reviewCount) || 120,
          soldCountLabel: p.soldCountLabel || 'Hot',
          statusBadge: p.statusBadge || 'Vedic Purity',
          badges: Array.isArray(p.badges) ? p.badges : [],
          description: p.description || '',
          imageUrls: Array.isArray(p.imageUrls) && p.imageUrls.length > 0 ? p.imageUrls : ['/images/products/ghee_tin.jpg'],
          vars: Array.isArray(p.vars) && p.vars.length > 0 
            ? p.vars 
            : [{ s: 'Standard', p: basePrice, mrp: Number(p.mrpPrice) || basePrice, on: true }]
        } as Product;
      });
  }, [dbProducts]);

  const handleSearch = (queryStr: string) => {
    if (!queryStr.trim()) return;
    router.push(`/category/all?q=${encodeURIComponent(queryStr.trim())}`);
  };

  const scrollToPantry = () => {
    const el = document.getElementById('cleanest-pantry');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategoryFilter = (catId: string) => {
    if (catId === 'ghee') {
      const el = document.getElementById('focus-ghee') || document.getElementById('cleanest-pantry');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId === 'sweets') {
      const el = document.getElementById('focus-sweets') || document.getElementById('cleanest-pantry');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId === 'honey') {
      const el = document.getElementById('focus-honey') || document.getElementById('cleanest-pantry');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      scrollToPantry();
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'cart') {
      setIsCartOpen(true);
      setActiveTab('home');
    } else if (tab === 'shop') {
      scrollToPantry();
      setActiveTab('home');
    } else if (tab === 'account') {
      router.push('/track');
    }
  };

  const cartIds = useMemo(() => cart.map(c => c.id), [cart]);

  return (
    <>
      {/* ── 1. Top Announcement Strip & Navigation Header ── */}
      <div className="sticky top-0 z-[900]">
        <Ticker />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          cartCount={totalQty}
          onFilter={handleCategoryFilter}
          onSearch={handleSearch}
        />
      </div>
      
      <div 
        className={cn(
          "min-h-screen bg-[#FFFFFF] text-[#100C06] overflow-x-hidden pb-24 md:pb-0"
        )}
      >
        <main>
          {/* ── 2. Hero Festive Purity Sale Banner ── */}
          <FestiveHero onShopClick={scrollToPantry} />

          {/* ── 3. Welcome to Vivaan / Your One-Stop Cleanest Pantry ── */}
          <div id="cleanest-pantry">
            <CleanestPantrySection
              products={products}
              cartIds={cartIds}
              onAddToCart={(p, v) => addToCart(p)}
            />
          </div>

          {/* ── 4. Native Ingredients. No Substitutes. ── */}
          <NativeIngredientsSection />

          {/* ── 5. Product in Focus: Explore Our A2 Desi Ghee ── */}
          <div id="focus-ghee">
            <FocusGheeSection
              products={products}
              cartIds={cartIds}
              onAddToCart={(p, v) => addToCart(p)}
            />
          </div>

          {/* ── 6. Product in Focus: Explore Our Homemade Sweets ── */}
          <div id="focus-sweets">
            <FocusSweetsSection
              products={products}
              cartIds={cartIds}
              onAddToCart={(p, v) => addToCart(p)}
            />
          </div>

          {/* ── 7. Product in Focus: Explore Our Raw Forest Honey ── */}
          <div id="focus-honey">
            <FocusHoneySection
              products={products}
              cartIds={cartIds}
              onAddToCart={(p, v) => addToCart(p)}
            />
          </div>

          {/* ── 8. Only Perfect Makes The Cut (Lab Quality Testing) ── */}
          <div id="quality-assurance">
            <QualityAssuranceSection />
          </div>

          {/* ── 9. From Our Farmers' To Your Kitchen (14 Days Journey) ── */}
          <div id="farm-journey">
            <FarmJourneySection />
          </div>

          {/* ── 10. What Do Our Customers Say (Testimonials) ── */}
          <CustomerReviewsSection />

          {/* ── 12. Recognized & Certified Purity Badges Strip ── */}
          <CertificationsStrip />
        </main>

        {/* ── 13. Comprehensive Forest Green Desktop Footer ── */}
        <Footer />
      </div>

      {/* Mobile Sticky Bottom Nav */}
      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={totalQty}
      />

      {/* Slide-out Cart Drawer */}
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => { setIsCartOpen(false); router.push('/checkout'); }}
      />
    </>
  );
}
