"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
  ShieldCheck,
  Search,
  X,
  Tag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

type PriceRangeType = 'all' | 'under-500' | '500-1000' | '1000-2000' | 'above-2000';

const PRICE_RANGE_LABELS: Record<PriceRangeType, string> = {
  'all': 'All Prices',
  'under-500': 'Under ₹500',
  '500-1000': '₹500 – ₹1,000',
  '1000-2000': '₹1,000 – ₹2,000',
  'above-2000': 'Above ₹2,000',
};

function CategoryDetailPageContent() {
  const router = useRouter();
  const urlParams = useParams();
  const searchParams = useSearchParams();
  
  const activeSlug = ((urlParams?.slug as string) || 'all').toLowerCase();
  const rawSearchParam = (searchParams.get('q') || '').trim();

  const db = useFirestore();
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: dbProducts } = useCollection(productsRef);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [justAddedMap, setJustAddedMap] = useState<Record<string, boolean>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [priceRange, setPriceRange] = useState<PriceRangeType>('all');
  const [searchQuery, setSearchQuery] = useState(rawSearchParam);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Synchronize searchQuery with URL query parameter
  useEffect(() => {
    setSearchQuery(rawSearchParam);
  }, [rawSearchParam]);

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

  // Filter products by category, search query, and price range
  const filteredProducts = useMemo(() => {
    let list = getCategoryProducts(activeSlug, masterProducts);

    // 1. Search Query Filter (Checks name, description, tags, category, and variant sizes)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchProduct = (p: Product) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = (p.cat || '').toLowerCase().includes(q);
        const statusMatch = (p.statusBadge || '').toLowerCase().includes(q);
        const badgeMatch = Array.isArray(p.badges) && p.badges.some(b => b.toLowerCase().includes(q));
        const varMatch = Array.isArray(p.vars) && p.vars.some(v => (v.s || '').toLowerCase().includes(q));
        return nameMatch || descMatch || catMatch || statusMatch || badgeMatch || varMatch;
      };

      const inCategoryMatches = list.filter(matchProduct);
      if (inCategoryMatches.length > 0) {
        list = inCategoryMatches;
      } else if (activeSlug !== 'all') {
        // Fallback: search across all master products if current sub-category has 0 matches
        const allMatches = masterProducts.filter(matchProduct);
        if (allMatches.length > 0) {
          list = allMatches;
        } else {
          list = [];
        }
      } else {
        list = [];
      }
    }

    // 2. Price Range / Product Cost Filter
    // Checks base product price AND all variant prices so high-range variants (e.g. 5L tins, combos) are included!
    if (priceRange !== 'all') {
      list = list.filter((p) => {
        const prices = [
          Number(p.price) || 0,
          ...(Array.isArray(p.vars) ? p.vars.map(v => Number(v.p) || 0) : [])
        ].filter(pr => pr > 0);

        if (priceRange === 'under-500') {
          return prices.some(pr => pr < 500);
        } else if (priceRange === '500-1000') {
          return prices.some(pr => pr >= 500 && pr <= 1000);
        } else if (priceRange === '1000-2000') {
          return prices.some(pr => pr > 1000 && pr <= 2000);
        } else if (priceRange === 'above-2000') {
          // Highest Price Range: includes any product where base price OR variant price >= 2000
          return prices.some(pr => pr >= 2000);
        }
        return true;
      });
    }

    // 3. Sorting
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return list;
  }, [activeSlug, masterProducts, searchQuery, priceRange, sortBy]);

  // Automatically select the variant that matches the active price range
  const getActiveVariantIdx = (p: Product) => {
    const userSelected = selectedVariants[p.id];
    if (typeof userSelected === 'number') return userSelected;

    if (priceRange !== 'all' && Array.isArray(p.vars) && p.vars.length > 1) {
      const matchIdx = p.vars.findIndex(v => {
        const pr = Number(v.p) || 0;
        if (priceRange === 'under-500') return pr < 500;
        if (priceRange === '500-1000') return pr >= 500 && pr <= 1000;
        if (priceRange === '1000-2000') return pr > 1000 && pr <= 2000;
        if (priceRange === 'above-2000') return pr >= 2000;
        return false;
      });
      if (matchIdx >= 0) return matchIdx;
    }

    return 0;
  };

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
    const varIdx = getActiveVariantIdx(product);
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

  const clearSearch = () => {
    setSearchQuery('');
    router.push(`/category/${activeSlug}`);
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
          onSearch={(q) => {
            setSearchQuery(q);
            router.push(`/category/all?q=${encodeURIComponent(q)}`);
          }}
        />
      </div>

      <div className="min-h-screen bg-[#FBF9F5] text-[#100C06] pb-24 md:pb-0 font-sans">
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
            
            {/* ── Left Sidebar (Desktop) ── */}
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

              {/* Price Filter Quick Links in Desktop Sidebar */}
              <div className="mt-6 pt-5 border-t border-[#EAE3D2]">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-[#6B5A45] uppercase tracking-wider mb-2.5">
                  <Tag className="w-3.5 h-3.5 text-[#0D3B2E]" />
                  <span>Price Range</span>
                </div>
                <div className="space-y-1">
                  {(['all', 'under-500', '500-1000', '1000-2000', 'above-2000'] as PriceRangeType[]).map((rangeKey) => (
                    <button
                      key={rangeKey}
                      type="button"
                      onClick={() => setPriceRange(rangeKey)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between",
                        priceRange === rangeKey
                          ? "bg-[#0D3B2E] text-white font-bold"
                          : "text-gray-600 hover:bg-[#F9F7F2] hover:text-gray-900"
                      )}
                    >
                      <span>{PRICE_RANGE_LABELS[rangeKey]}</span>
                      {priceRange === rangeKey && <Check className="w-3 h-3 text-[#EBB847]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purity Guarantee Trust Badge in Sidebar */}
              <div className="mt-6 pt-5 border-t border-[#EAE3D2] text-center">
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
                      {searchQuery ? `Search Results: "${searchQuery}"` : currentCategory.name}
                    </h1>
                    <span className="shrink-0 text-[8.5px] sm:text-[9.5px] font-black text-[#6B5A45] tracking-[1.5px] uppercase bg-[#FAF7F2] border border-[#EAE3D2] px-2 py-0.5 rounded-full">
                      Farm Fresh
                    </span>
                  </div>

                  {/* Right: Item Count & Compact Filter and Sort Dropdown */}
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
                          <span className="text-xs font-bold hidden sm:inline">Filter & Sort</span>
                          <MoreVertical className="w-4 h-4 text-[#0D3B2E]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white shadow-xl border border-gray-100 z-[1000]">
                        
                        {/* Sort Options */}
                        <div className="px-2 py-1 text-[10px] font-black text-[#6B5A45] uppercase tracking-wider">
                          Sort By
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

                        <DropdownMenuSeparator className="my-1.5" />

                        {/* Price Range Filter Options */}
                        <div className="px-2 py-1 text-[10px] font-black text-[#6B5A45] uppercase tracking-wider">
                          Product Cost / Price Filter
                        </div>
                        {(['all', 'under-500', '500-1000', '1000-2000', 'above-2000'] as PriceRangeType[]).map((rangeKey) => (
                          <DropdownMenuItem
                            key={rangeKey}
                            onClick={() => setPriceRange(rangeKey)}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl cursor-pointer transition-colors",
                              priceRange === rangeKey
                                ? "bg-[#0D3B2E] text-white font-bold"
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            <span>{PRICE_RANGE_LABELS[rangeKey]}</span>
                            {priceRange === rangeKey && <Check className="w-3.5 h-3.5 text-[#EBB847]" />}
                          </DropdownMenuItem>
                        ))}

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Active Filter Badges Strip */}
                {(searchQuery || priceRange !== 'all') && (
                  <div className="flex items-center gap-2 flex-wrap pt-2.5 mt-2.5 border-t border-gray-100 text-xs">
                    <span className="text-[11px] font-bold text-gray-400">Active Filters:</span>
                    
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0D3B2E]/10 text-[#0D3B2E] font-bold text-[11px]">
                        <Search className="w-3 h-3" />
                        <span>"{searchQuery}"</span>
                        <button 
                          onClick={clearSearch} 
                          className="hover:text-red-600 transition-colors cursor-pointer ml-0.5"
                          aria-label="Clear search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {priceRange !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px]">
                        <Tag className="w-3 h-3 text-amber-700" />
                        <span>{PRICE_RANGE_LABELS[priceRange]}</span>
                        <button 
                          onClick={() => setPriceRange('all')} 
                          className="hover:text-red-600 transition-colors cursor-pointer ml-0.5"
                          aria-label="Clear price filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setPriceRange('all');
                        clearSearch();
                      }}
                      className="text-[11px] text-gray-500 hover:text-[#0D3B2E] underline cursor-pointer ml-auto"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Product Cards Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-6">
                  {filteredProducts.map((p) => {
                    const varIdx = getActiveVariantIdx(p);
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
                        className="group bg-white rounded-xl sm:rounded-2xl border border-[#EAE3D2] overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 relative"
                      >
                        {/* Top Image Container */}
                        <div className="relative w-full aspect-square bg-[#FAF7F2] overflow-hidden p-2 sm:p-4 flex items-center justify-center">
                          {/* Discount Pill Badge */}
                          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 flex flex-col gap-1 items-start">
                            {discount > 0 && (
                              <span className="bg-[#EAB308] text-[#1F2937] text-[8.5px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-[4px] uppercase tracking-wider shadow-2xs">
                                {discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* Wishlist Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleWishlist(p.id, e)}
                            className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-xs border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label="Wishlist"
                          >
                            <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isWishlisted && "fill-red-500 text-red-500")} />
                          </button>

                          {/* Product Image */}
                          <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={(p.imageUrls && p.imageUrls[0]) || '/images/products/ghee_tin.jpg'}
                              alt={p.name}
                              fill
                              className="object-contain p-1.5 sm:p-3"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                            />
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-1.5 sm:gap-2">
                          <div className="space-y-1">
                            {/* Purity / Process Tag */}
                            <span className="inline-block text-[8px] sm:text-[9.5px] font-black text-emerald-800 bg-[#E8F5EE] px-2 py-0.5 rounded-md tracking-wider uppercase truncate max-w-full">
                              {p.statusBadge || 'Vedic Bilona · 100% Pure'}
                            </span>

                            {/* Product Name */}
                            <h3 className="font-serif text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#0D3B2E] transition-colors line-clamp-2 min-h-[2.4em] leading-tight sm:leading-snug">
                              {p.name}
                            </h3>

                            {/* Rating */}
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                              <div className="flex items-center text-amber-500">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                                <span className="font-black text-gray-900 ml-1 text-[10px] sm:text-xs">{p.rating || 4.9}</span>
                              </div>
                              <span className="text-gray-400 text-[9px] sm:text-[11px]">({p.reviewCount || 120})</span>
                            </div>
                          </div>

                          {/* Variant Pills */}
                          {Array.isArray(p.vars) && p.vars.length > 1 && (
                            <div className="flex items-center gap-1 sm:gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                              {p.vars.map((v, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => handleVariantSelect(p.id, idx, e)}
                                  className={cn(
                                    "text-[8.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer whitespace-nowrap",
                                    varIdx === idx
                                      ? "bg-[#0D3B2E] text-white border-[#0D3B2E]"
                                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                  )}
                                >
                                  {v.s}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Price & Add to Cart Button */}
                          <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between gap-1 mt-auto">
                            <div className="min-w-0">
                              <div className="text-xs sm:text-base font-black text-[#0D3B2E] leading-none">
                                ₹{displayPrice.toLocaleString('en-IN')}
                              </div>
                              {displayMrp > displayPrice && (
                                <div className="text-[9.5px] sm:text-xs text-gray-400 line-through truncate">
                                  ₹{displayMrp.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleAdd(p, e)}
                              className={cn(
                                "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[9.5px] sm:text-xs uppercase tracking-wider flex items-center gap-1 transition-all duration-200 cursor-pointer shadow-xs active:scale-95 shrink-0",
                                isAdded || inCart
                                  ? "bg-emerald-700 text-white"
                                  : "bg-[#0D3B2E] text-white hover:bg-[#14472D]"
                              )}
                            >
                              {isAdded ? (
                                <>
                                  <span className="hidden xs:inline">ADDED</span>
                                  <Check className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  <span>ADD</span>
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </div>

                        </div>

                        {/* YOUR PRICE Green Offer Box */}
                        <div className="mt-auto border border-[#143E31] rounded-lg overflow-hidden bg-white">
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
                  <h3 className="font-serif text-lg font-bold text-[#0D3B2E]">
                    {searchQuery ? `No products match "${searchQuery}"` : 'No products found in this category'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 mb-5">
                    {searchQuery 
                      ? 'Try searching for "Ghee", "Murrah", "Honey", or clear your price filters.' 
                      : 'We are harvesting and preparing new batches from the farm.'}
                  </p>
                  <div className="flex justify-center gap-3">
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0D3B2E] text-[#0D3B2E] font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#0D3B2E]/5"
                      >
                        Clear Search
                      </button>
                    )}
                    <Link
                      href="/category/all"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D3B2E] text-white font-bold text-xs uppercase tracking-wider"
                    >
                      View All Products
                    </Link>
                  </div>
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

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0D3B2E] border-t-transparent animate-spin" />
      </div>
    }>
      <CategoryDetailPageContent />
    </Suspense>
  );
}
