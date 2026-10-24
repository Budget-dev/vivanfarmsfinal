"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { PantryCategoryIcons } from './PantryCategoryIcons';
import { useAutoScroll } from '@/hooks/use-auto-scroll';

interface CleanestPantrySectionProps {
  products: Product[];
  onAddToCart: (product: Product, variant?: any) => void;
  cartIds?: (string | number)[];
}

const PANTRY_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'ghee', label: 'A2 Ghee', icon: '🐄' },
  { id: 'sweets', label: 'Sweets', icon: '🍬' },
  { id: 'honey', label: 'Raw Honey', icon: '🍯' },
];

export const CleanestPantrySection: React.FC<CleanestPantrySectionProps> = ({
  products,
  onAddToCart,
  cartIds = []
}) => {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [justAddedMap, setJustAddedMap] = useState<Record<string, boolean>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { pause: pauseAutoScroll } = useAutoScroll(scrollRef, {
    interval: 3500,
    resumeDelay: 3000
  });

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pauseAutoScroll();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scroll = (direction: 'left' | 'right') => {
    pauseAutoScroll();
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pauseAutoScroll();
    const varIdx = selectedVariants[product.id] || 0;
    const variant = Array.isArray(product.vars) && product.vars.length > varIdx ? product.vars[varIdx] : null;

    const itemToAdd: Product = {
      ...product,
      price: variant?.p ? Number(variant.p) : Number(product.price) || 0,
      vol: variant?.s || product.vol || '500 ml'
    };

    onAddToCart(itemToAdd, variant);
    setJustAddedMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setJustAddedMap(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const handleVariantSelect = (productId: string, idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pauseAutoScroll();
    setSelectedVariants(prev => ({ ...prev, [productId]: idx }));
  };

  const filteredProducts = products.filter(p => {
    if (selectedCat === 'all') return true;
    if (selectedCat === 'oils') return p.cat === 'oils' || p.name.toLowerCase().includes('oil');
    if (selectedCat === 'ghee') return p.cat === 'ghee' || p.name.toLowerCase().includes('ghee');
    if (selectedCat === 'sweets') return p.cat === 'sweets' || p.name.toLowerCase().includes('sweet') || p.name.toLowerCase().includes('ladoo') || p.name.toLowerCase().includes('peda');
    if (selectedCat === 'honey') return p.cat === 'honey' || p.name.toLowerCase().includes('honey');
    if (selectedCat === 'superfoods') return p.cat === 'superfoods' || p.name.toLowerCase().includes('chyawanprash') || p.name.toLowerCase().includes('butter') || p.name.toLowerCase().includes('makkhan');
    if (selectedCat === 'atta' || selectedCat === 'staples') {
      return p.cat === 'staples' || p.name.toLowerCase().includes('atta') || p.name.toLowerCase().includes('flour') || p.name.toLowerCase().includes('sugar') || p.name.toLowerCase().includes('jaggery') || p.name.toLowerCase().includes('wheat');
    }
    if (selectedCat === 'combos' || selectedCat === 'gift-card') {
      return p.cat === 'combo' || p.cat === 'combos' || p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack') || p.name.toLowerCase().includes('hamper') || p.name.toLowerCase().includes('trio');
    }
    return p.cat === selectedCat;
  });

  return (
    <section id="cleanest-pantry" className="py-6 sm:py-10 md:py-16 bg-[#FFFFFF] border-b border-[#EAE3D2] relative select-none">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center mb-4 sm:mb-6 md:mb-7">
          <p className="text-[10px] sm:text-xs md:text-sm font-serif font-black text-[#6B5A45] tracking-[2.5px] uppercase mb-1">
            WELCOME TO VIVAAN
          </p>
          <h2 className="font-serif text-[17px] min-[360px]:text-[19px] min-[400px]:text-[22px] sm:text-3xl md:text-4xl font-extrabold text-[#0D3B2E] tracking-tight whitespace-nowrap">
            Your One-Stop Cleanest Pantry
          </h2>
          <div className="w-12 sm:w-16 h-0.5 bg-[#0D3B2E]/25 mx-auto mt-2 rounded-full" />
        </div>

        {/* Authentic Circular Category Icons Row matching screenshot */}
        <PantryCategoryIcons
          selectedId={selectedCat}
          onSelect={(id) => setSelectedCat(prev => prev === id ? 'all' : id)}
        />

        {/* Carousel Container with Controls */}
        <div className="relative group/carousel">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Next products"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Horizontal Product Cards Row */}
          <div
            ref={scrollRef}
            onScroll={() => {
              if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                const maxScroll = scrollWidth - clientWidth;
                if (maxScroll > 0) {
                  setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
                }
              }
            }}
            className="flex items-stretch gap-2.5 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-5 pt-1 px-1"
          >
            {filteredProducts.map((p) => {
              const varIdx = selectedVariants[p.id] || 0;
              const currentVar = Array.isArray(p.vars) && p.vars.length > varIdx ? p.vars[varIdx] : null;
              const displayPrice = currentVar?.p ? Number(currentVar.p) : Number(p.price) || 0;
              const rawMrp = currentVar?.mrp ? Number(currentVar.mrp) : Number(p.mrpPrice) || displayPrice;
              const displayMrp = rawMrp > displayPrice ? rawMrp : Math.round(displayPrice * 1.4);
              const discount = Math.round(((displayMrp - displayPrice) / displayMrp) * 100);
              const yourPrice = Math.round(displayPrice * 0.95);
              const isAdded = !!justAddedMap[p.id];
              const inCart = cartIds.includes(p.id);

              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  prefetch={true}
                  className="w-[175px] sm:w-[240px] md:w-[260px] shrink-0 bg-white rounded-2xl border border-gray-200 hover:border-[#0D3B2E]/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group relative p-2.5 sm:p-3 select-none"
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
                        sizes="(max-width: 640px) 180px, 280px"
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
        </div>

        {/* Scroll Progress Bar & See All Button matching reference screenshot */}
        <div className="flex items-center justify-between mt-3 sm:mt-5 px-1 sm:px-2">
          {/* Scroll Progress Indicator */}
          <div className="w-24 sm:w-36 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gray-800 rounded-full transition-all duration-150"
              style={{
                width: '35%',
                transform: `translateX(${scrollProgress * 185}%)`
              }}
            />
          </div>

          {/* See All Button */}
          <Link
            href={`/category/${selectedCat === 'all' ? 'ghee' : selectedCat}`}
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            aria-label="See all products"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};
