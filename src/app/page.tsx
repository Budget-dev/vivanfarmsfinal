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

const DEFAULT_CATALOG: Product[] = [
  {
    id: 'ghee-gir-tin-1l',
    name: 'A2 Desi Gir Cow Cultured Bilona Ghee (Heritage Tin)',
    cat: 'ghee',
    vol: '1000 ml (1 L)',
    price: 1850,
    mrpPrice: 2200,
    rating: 5.0,
    reviewCount: 940,
    purityCoins: 185,
    soldCountLabel: '5.2k sold',
    stock: 80,
    statusBadge: 'Traditional Metal Tin',
    badges: ['Top Rated'],
    pi: 0,
    imageUrls: ['/images/products/ghee_tin.jpg'],
    vars: [
      { s: '500 ml', p: 980, mrp: 1150, on: false },
      { s: '1000 ml (1 L)', p: 1850, mrp: 2200, on: true },
      { s: '5000 ml (5 L)', p: 8900, mrp: 10500, on: false },
    ],
    description: 'Slow-cooked over slow wood fire in earthen pots, made from cultured A2 Gir curd using the two-way wooden bilona.'
  },
  {
    id: 'ghee-gir-jar-500ml',
    name: 'A2 Desi Gir Cow Cultured Bilona Ghee (Glass Jar)',
    cat: 'ghee',
    vol: '500 ml',
    price: 980,
    mrpPrice: 1150,
    rating: 4.9,
    reviewCount: 1420,
    purityCoins: 98,
    soldCountLabel: '8.4k sold',
    stock: 120,
    statusBadge: 'Golden Granular Danedar',
    badges: ['Bestseller'],
    pi: 1,
    imageUrls: ['/images/products/ghee_jar.jpg'],
    vars: [
      { s: '250 ml', p: 520, mrp: 600, on: false },
      { s: '500 ml', p: 980, mrp: 1150, on: true },
      { s: '1000 ml (1 L)', p: 1850, mrp: 2200, on: false },
    ],
    description: 'Golden granular texture with intoxicating nutty aroma. High in natural CLA, butyric acid, and fat-soluble vitamins.'
  },
  {
    id: 'ghee-buffalo-murrah-1l',
    name: 'Vedic Pure Desi Murrah Buffalo Ghee (Bilona)',
    cat: 'ghee',
    vol: '1000 ml (1 L)',
    price: 1350,
    mrpPrice: 1600,
    rating: 4.9,
    reviewCount: 680,
    purityCoins: 135,
    soldCountLabel: '3.1k sold',
    stock: 90,
    statusBadge: 'High Smoke Point',
    badges: ['Heritage'],
    pi: 2,
    imageUrls: ['/images/products/ghee_tin.jpg'],
    vars: [
      { s: '500 ml', p: 720, mrp: 850, on: false },
      { s: '1000 ml (1 L)', p: 1350, mrp: 1600, on: true },
      { s: '5000 ml (5 L)', p: 6400, mrp: 7500, on: false },
    ],
    description: 'Handcrafted from grass-fed Murrah buffalo whole milk curd. Creamy white granular texture with deep richness.'
  },
  {
    id: 'ghee-hallikar-cow-500ml',
    name: 'Native Hallikar Cow Vedic Ghee (Rare Breed)',
    cat: 'ghee',
    vol: '500 ml',
    price: 1150,
    mrpPrice: 1350,
    rating: 4.9,
    reviewCount: 290,
    purityCoins: 115,
    soldCountLabel: '1.1k sold',
    stock: 45,
    statusBadge: 'Rare Indigenous Breed',
    badges: ['Artisanal'],
    pi: 3,
    imageUrls: ['/images/products/ghee_jar.jpg'],
    vars: [
      { s: '500 ml', p: 1150, mrp: 1350, on: true },
      { s: '1000 ml (1 L)', p: 2150, mrp: 2500, on: false },
    ],
    description: 'Sourced from agile indigenous Hallikar cows grazing on wild herbal shrubs. Intense therapeutic qualities.'
  },
  {
    id: 'sweets-handmade-ladoo',
    name: 'Home made sweets (Artisanal Bilona Ghee Laddus)',
    cat: 'sweets',
    vol: '500 g',
    price: 450,
    mrpPrice: 550,
    rating: 4.9,
    reviewCount: 120,
    purityCoins: 45,
    soldCountLabel: '1.2k sold',
    stock: 55,
    statusBadge: 'Freshly Prepared',
    badges: ['Bestseller', 'No Refined Sugar'],
    pi: 4,
    imageUrls: ['/images/products/sweets.jpg'],
    vars: [
      { s: '250 g', p: 240, mrp: 290, on: false },
      { s: '500 g', p: 450, mrp: 550, on: true },
      { s: '1 kg (1000g)', p: 850, mrp: 1050, on: false },
    ],
    description: 'Traditional slow-roasted besan and dry fruit gond laddus made strictly with our in-house A2 Gir Bilona Ghee and organic dhaga mishri.'
  },
  {
    id: 'sweets-motichoor-peda',
    name: 'Vedic Mathura Peda & Dry Fruit Barfi Assortment',
    cat: 'sweets',
    vol: '500 g',
    price: 520,
    mrpPrice: 620,
    rating: 5.0,
    reviewCount: 95,
    purityCoins: 52,
    soldCountLabel: '850+ sold',
    stock: 40,
    statusBadge: 'A2 Gir Khoya Base',
    badges: ['Festive Pick'],
    pi: 5,
    imageUrls: ['/images/products/sweets.jpg'],
    vars: [
      { s: '250 g', p: 280, mrp: 330, on: false },
      { s: '500 g', p: 520, mrp: 620, on: true },
      { s: '1 kg', p: 980, mrp: 1190, on: false },
    ],
    description: 'Prepared by simmering whole A2 Gir milk on iron kadhai. Naturally flavored with crushed green cardamom and Kashmiri saffron.'
  },
  {
    id: 'honey-wild-forest',
    name: 'Raw Unprocessed Wild Forest Honey',
    cat: 'honey',
    vol: '500 ml',
    price: 850,
    mrpPrice: 999,
    rating: 4.9,
    reviewCount: 120,
    purityCoins: 85,
    soldCountLabel: '4.8k sold',
    stock: 90,
    statusBadge: 'Selling Fast',
    badges: ['15% OFF', 'Unpasteurized & Raw'],
    pi: 6,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '250 g', p: 450, mrp: 520, on: false },
      { s: '500 ml', p: 850, mrp: 999, on: true },
      { s: '1 kg', p: 1550, mrp: 1850, on: false },
    ],
    description: 'Ethically harvested from wild bee colonies in Gujarat and Himachal deciduous forests. Rich in pollen enzymes and natural minerals.'
  },
  {
    id: 'honey-jamun-raw',
    name: 'Raw Organic Jamun Monofloral Honey',
    cat: 'honey',
    vol: '500 g',
    price: 540,
    mrpPrice: 650,
    rating: 4.8,
    reviewCount: 310,
    purityCoins: 54,
    soldCountLabel: '1.7k sold',
    stock: 50,
    statusBadge: 'Low Glycemic Index',
    badges: ['Single Origin'],
    pi: 7,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '500 g', p: 540, mrp: 650, on: true },
      { s: '1 kg', p: 990, mrp: 1200, on: false },
    ],
    description: 'Gathered by honeybees foraging exclusively on flowering Indian Blackberry (Jamun) trees. Deep amber color with herbal undertones.'
  }
];

export default function VivaanFarms() {
  const router = useRouter();
  const db = useFirestore();
  
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: dbProducts } = useCollection(productsRef);

  const [activeTab, setActiveTab] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { cart, addToCart, updateQty, removeFromCart, totalQty } = useCart();

  const products = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return DEFAULT_CATALOG;
    
    const mapped = dbProducts
      .filter(p => p.isLive !== false)
      .map((p, i) => {
        const catId = (p.categoryId || 'uncategorized').toLowerCase();
        const basePrice = Number(p.basePrice) || 0;
        
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
            : [{ s: 'Standard', p: basePrice, on: true }]
        } as Product;
      });

    // Always ensure full catalog categories (such as sweets, ghee, honey) are available
    const existingIds = new Set(mapped.map(m => m.id));
    const fallbacksToAdd = DEFAULT_CATALOG.filter(d => !existingIds.has(d.id));
    return [...mapped, ...fallbacksToAdd];
  }, [dbProducts]);

  const handleSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    try {
      const res = await naturalLanguageProductSearch({ query: queryStr });
      if (res.categories.length > 0) {
        scrollToPantry();
      }
    } catch (e) {
      console.error(e);
    }
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

          {/* ── 6. Only Perfect Makes The Cut (Lab Quality Testing) ── */}
          <div id="quality-assurance">
            <QualityAssuranceSection />
          </div>

          {/* ── 11. What Do Our Customers Say (Testimonials) ── */}
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
