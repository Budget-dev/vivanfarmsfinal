"use client";

import React, { useState, useMemo, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Check, 
  SlidersHorizontal, 
  MoreVertical,
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Header } from '@/components/vivaan/Header';
import { Ticker } from '@/components/vivaan/Ticker';
import { Footer } from '@/components/vivaan/Footer';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { CertificationsStrip } from '@/components/vivaan/CertificationsStrip';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';
import { Product } from '@/types';
import { CATEGORIES, SIDEBAR_CATEGORIES, ALL_PRODUCTS, getCategoryProducts } from '@/lib/catalog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function CategoryDetailPage() {
  const router = useRouter();
  const urlParams = useParams();
  const activeSlug = ((urlParams?.slug as string) || 'all').toLowerCase();

  const db = useFirestore();
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: dbProducts } = useCollection(productsRef);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [justAddedMap, setJustAddedMap] = useState<Record<string, boolean>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { cart, addToCart, updateQty, removeFromCart, totalQty } = useCart();
  const cartIds = useMemo(() => cart.map(c => c.id), [cart]);

  // Merge Firestore products with rich default catalog
  const masterProducts = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return ALL_PRODUCTS;
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

    const existingIds = new Set(mapped.map(m => m.id));
    const fallbacks = ALL_PRODUCTS.filter(d => !existingIds.has(d.id));
    return [...mapped, ...fallbacks];
  }, [dbProducts]);

  // Find active category metadata
  const currentCategory = useMemo(() => {
    return CATEGORIES.find(c => c.slug === activeSlug || c.id === activeSlug) || CATEGORIES[0];
  }, [activeSlug]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    let list = getCategoryProducts(activeSlug, masterProducts);

    // Apply sort
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return list;
  }, [activeSlug, masterProducts, sortBy]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVariantSelect = (productId: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVariants(prev => ({ ...prev, [productId]: idx }));
  };

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const varIdx = selectedVariants[product.id] || 0;
    const variant = Array.isArray(product.vars) && product.vars.length > varIdx ? product.vars[varIdx] : null;

    const itemToAdd: Product = {
      ...product,
      price: variant?.p ? Number(variant.p) : Number(product.price) || 0,
      vol: variant?.s || product.vol || 'Standard'
    };

    addToCart(itemToAdd, 1);
    setJustAddedMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setJustAddedMap(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <>
      {/* ── 1. Announcement Ticker & Header ── */}
      <div className="sticky top-0 z-[900]">
        <Ticker />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          cartCount={totalQty}
          onFilter={(cat) => router.push(`/category/${cat}`)}
          onSearch={(q) => router.push(`/category/all?q=${encodeURIComponent(q)}`)}
        />
      </div>

      <div className="min-h-screen bg-[#FBF9F5] text-[#100C06] pb-24 md:pb-0">
        <main className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12 py-4 sm:py-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 sm:mb-6">
            <Link href="/" className="hover:text-[#0D3B2E] transition-colors flex items-center gap-1">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Categories</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-bold text-[#0D3B2E]">{currentCategory.name}</span>
          </nav>

          {/* Mobile Category Scrollable Pill Tabs */}
          <div className="lg:hidden mb-5 overflow-x-auto no-scrollbar -mx-3 px-3 py-1 flex items-center gap-2">
            {SIDEBAR_CATEGORIES.map(cat => {
              const isActive = cat.slug === activeSlug || cat.id === activeSlug;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  prefetch={true}
                  className={cn(
                    "text-xs font-serif font-bold whitespace-nowrap px-4 py-2 rounded-full transition-all shrink-0",
                    isActive
                      ? "bg-[#EAE5D9] text-[#0D3B2E] font-black shadow-xs ring-1 ring-[#0D3B2E]/20"
                      : "bg-white text-[#2C4A3E] border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {/* Main 2-Column Layout */}
          <div className="flex items-start gap-8 lg:gap-12">
            
            {/* ── Left Sidebar (Desktop - Matching Screenshot 1) ── */}
            <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[130px] bg-white rounded-2xl p-5 border border-[#EAE3D2] shadow-xs">
              <div className="flex flex-col space-y-2">
                {SIDEBAR_CATEGORIES.map(cat => {
                  const isActive = cat.slug === activeSlug || cat.id === activeSlug;

                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      prefetch={true}
                      className={cn(
                        "block font-serif text-[16px] px-4 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-2.5",
                        isActive
                          ? "bg-[#EFECE6] text-[#0D3B2E] font-extrabold shadow-2xs"
                          : "text-[#1C3A27] hover:text-[#0D3B2E] hover:bg-[#F9F7F2] font-semibold"
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Purity Guarantee Trust Badge in Sidebar */}
              <div className="mt-8 pt-6 border-t border-[#EAE3D2] text-center">
                <div className="w-10 h-10 rounded-full bg-[#0D3B2E]/10 flex items-center justify-center text-[#0D3B2E] mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5 text-[#0D3B2E]" />
                </div>
                <p className="font-serif font-extrabold text-xs text-[#0D3B2E]">100% Vedic Guarantee</p>
                <p className="text-[11px] text-[#6B5A45] mt-1 leading-snug">
                  Zero preservatives, chemicals, or synthetic additives.
                </p>
              </div>
            </aside>

            {/* ── Right Content Area ── */}
            <div className="flex-1 min-w-0">
              
              {/* Compact Category Header & Filter Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 border border-[#EAE3D2] mb-3.5 sm:mb-5 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Category Title & Compact Farm Fresh Badge */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <h1 className="font-serif text-base sm:text-xl font-extrabold text-[#0D3B2E] tracking-tight truncate">
                      {currentCategory.name}
                    </h1>
                    <span className="shrink-0 text-[8.5px] sm:text-[9.5px] font-black text-[#6B5A45] tracking-[1.5px] uppercase bg-[#FAF7F2] border border-[#EAE3D2] px-2 py-0.5 rounded-full">
                      Farm Fresh
                    </span>
                  </div>

                  {/* Right: Item Count & Compact Three-Dots Filter Button */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-400 whitespace-nowrap">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-8 w-8 sm:w-auto sm:h-8 sm:px-2.5 rounded-lg border border-gray-200 bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#0D3B2E] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          aria-label="Filter and Sort"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0D3B2E] hidden sm:block" />
                          <span className="text-xs font-bold hidden sm:inline">Sort</span>
                          <MoreVertical className="w-4 h-4 text-[#0D3B2E]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 bg-white shadow-xl border border-gray-100 z-[1000]">
                        <div className="px-2.5 py-1 text-[10px] font-black text-[#6B5A45] uppercase tracking-wider">
                          Sort Products
                        </div>
                        {[
                          { id: 'featured', label: 'Featured' },
                          { id: 'price-asc', label: 'Price: Low to High' },
                          { id: 'price-desc', label: 'Price: High to Low' },
                          { id: 'rating', label: 'Highest Rated' },
                        ].map((option) => (
                          <DropdownMenuItem
                            key={option.id}
                            onClick={() => setSortBy(option.id as any)}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl cursor-pointer transition-colors",
                              sortBy === option.id
                                ? "bg-[#0D3B2E]/10 text-[#0D3B2E] font-bold"
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            <span>{option.label}</span>
                            {sortBy === option.id && <Check className="w-3.5 h-3.5 text-[#0D3B2E]" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Product Cards Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-6">
                  {filteredProducts.map((p) => {
                    const varIdx = selectedVariants[p.id] || 0;
                    const currentVar = Array.isArray(p.vars) && p.vars.length > varIdx ? p.vars[varIdx] : null;
                    const displayPrice = currentVar?.p ? Number(currentVar.p) : Number(p.price) || 0;
                    const rawMrp = currentVar?.mrp ? Number(currentVar.mrp) : Number(p.mrpPrice) || displayPrice;
                    const displayMrp = rawMrp > displayPrice ? rawMrp : Math.round(displayPrice * 1.4);
                    const discount = Math.round(((displayMrp - displayPrice) / displayMrp) * 100);
                    const yourPrice = Math.round(displayPrice * 0.95);
                    const isWishlisted = !!wishlist[p.id];
                    const isAdded = !!justAddedMap[p.id];
                    const inCart = cartIds.includes(p.id);

                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        prefetch={true}
                        className="bg-white rounded-2xl border border-gray-200 hover:border-[#0D3B2E]/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group relative p-2.5 sm:p-3 select-none"
                      >
                        {/* Top-Left Hanging FLAT OFF Deep Green Badge */}
                        <div className="absolute top-2 left-2 z-10 bg-[#143E31] text-white rounded-b-xl rounded-t-sm px-2 pt-1 pb-1.5 text-center shadow-xs flex flex-col items-center justify-center leading-none select-none pointer-events-none">
                          <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-white">FLAT</span>
                          <span className="text-[12px] sm:text-[13px] font-black tracking-tight text-[#EBB847] my-0.5">{discount}%</span>
                          <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-white">OFF</span>
                        </div>

                        {/* Clean White Product Image Area */}
                        <div className="relative w-full h-[155px] sm:h-[195px] md:h-[215px] flex items-center justify-center bg-white mt-1">
                          <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={(p.imageUrls && p.imageUrls[0]) || '/images/products/ghee_tin.jpg'}
                              alt={p.name}
                              fill
                              className="object-contain p-1 sm:p-2"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                            />
                          </div>
                        </div>

                        {/* Floating ADD Button aligned to the right */}
                        <div className="flex justify-end -mt-3 relative z-10 mb-1">
                          <button
                            type="button"
                            onClick={(e) => handleAdd(p, e)}
                            className={cn(
                              "px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs active:scale-95",
                              isAdded || inCart
                                ? "bg-emerald-800 text-white"
                                : "bg-[#1D4A3E] text-white hover:bg-[#143E31]"
                            )}
                            aria-label={`Add ${p.name} to cart`}
                          >
                            <span>{isAdded ? 'ADDED' : inCart ? 'IN CART' : 'ADD'}</span>
                            {isAdded ? (
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            )}
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-[13px] sm:text-[15px] font-bold text-[#111827] group-hover:text-[#0D3B2E] transition-colors line-clamp-2 min-h-[2.4em] leading-snug">
                          {p.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-700 mt-1 mb-1.5">
                          <Star className="w-3.5 h-3.5 text-[#EAB308] fill-transparent stroke-[2.2] shrink-0" />
                          <span className="text-[11.5px] sm:text-xs text-gray-700 font-normal">
                            {p.reviewCount || 0} review
                          </span>
                        </div>

                        {/* Strikethrough Price on Left, Selling Price on Right */}
                        <div className="flex items-baseline gap-2.5 mt-0.5 mb-2">
                          {displayMrp > displayPrice && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through font-normal">
                              ₹{displayMrp.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-sm sm:text-base font-black text-black leading-none">
                            ₹{displayPrice.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* YOUR PRICE Green Offer Box */}
                        <div className="mt-auto border border-[#143E31] rounded-lg overflow-hidden bg-white">
                          {/* Dark Green Gradient Top Banner */}
                          <div className="bg-gradient-to-r from-[#1E4E40] to-[#143B2F] px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#A3C9BC] leading-tight">
                                YOUR PRICE
                              </span>
                              <span className="text-base sm:text-lg md:text-xl font-black text-white leading-none mt-0.5">
                                ₹ {yourPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="bg-[#EAB308] text-[#1F2937] px-2 py-0.5 rounded-[4px] text-[9.5px] sm:text-[10.5px] font-black tracking-tight whitespace-nowrap shadow-2xs">
                              {discount}% + 5% OFF
                            </div>
                          </div>

                          {/* Pale Mint Bottom Strip */}
                          <div className="bg-[#EDF5F1] px-2.5 py-1 sm:px-3 sm:py-1 border-t border-[#143E31]/20">
                            <p className="text-[8.5px] sm:text-[9.5px] text-[#0D3B2E] font-medium leading-tight truncate">
                              <span className="font-bold">MRP</span> ₹{displayMrp.toLocaleString('en-IN')} + 5% extra prepaid incl.
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-[#EAE3D2]">
                  <Sparkles className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-serif text-lg font-bold text-[#0D3B2E]">No products found in this category</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-5">
                    We are harvesting and preparing new batches from the farm.
                  </p>
                  <Link
                    href="/category/all"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D3B2E] text-white font-bold text-xs uppercase tracking-wider"
                  >
                    View All Products
                  </Link>
                </div>
              )}

            </div>
          </div>

        </main>

        <CertificationsStrip />
        <Footer />
      </div>

      <BottomNav 
        activeTab="shop" 
        onTabChange={(tab) => {
          if (tab === 'cart') setIsCartOpen(true);
          else if (tab === 'home') router.push('/');
          else if (tab === 'account') router.push('/track');
        }}
        cartCount={totalQty}
      />

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
