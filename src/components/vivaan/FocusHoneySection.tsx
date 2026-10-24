"use client";

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Check, Heart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface FocusHoneySectionProps {
  products: Product[];
  onAddToCart: (product: Product, variant?: any) => void;
  cartIds?: (string | number)[];
}

const DEFAULT_HONEY: Product[] = [
  {
    id: 'honey-wild-forest',
    name: 'Raw Unprocessed Wild Forest Honey (Ethical Hive Harvest)',
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
  },
  {
    id: 'honey-multiflora-himalayan',
    name: 'Pure Himalayan Multiflora Raw Forest Honey',
    cat: 'honey',
    vol: '500 g',
    price: 490,
    mrpPrice: 590,
    rating: 4.9,
    reviewCount: 230,
    purityCoins: 49,
    soldCountLabel: '2.3k sold',
    stock: 75,
    statusBadge: 'High Pollen Count',
    badges: ['Wild Harvest'],
    pi: 8,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '250 g', p: 270, mrp: 330, on: false },
      { s: '500 g', p: 490, mrp: 590, on: true },
      { s: '1 kg', p: 940, mrp: 1140, on: false },
    ],
    description: 'Collected from wildflower pastures of the pristine lower Himalayan belt. Golden hue with a delicate floral bouquet.'
  },
  {
    id: 'honey-eucalyptus-neem',
    name: 'Raw Wild Eucalyptus & Neem Flora Honey',
    cat: 'honey',
    vol: '500 g',
    price: 580,
    mrpPrice: 690,
    rating: 4.9,
    reviewCount: 180,
    purityCoins: 58,
    soldCountLabel: '1.5k sold',
    stock: 60,
    statusBadge: 'Ayurvedic Tonic',
    badges: ['Naturally Antibacterial'],
    pi: 9,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '500 g', p: 580, mrp: 690, on: true },
      { s: '1 kg', p: 1080, mrp: 1290, on: false },
    ],
    description: 'Infused with therapeutic nectar from indigenous Eucalyptus and medicinal Neem blooms. Deep woodsy taste and potent bio-activity.'
  },
  {
    id: 'honey-acacia-blossom',
    name: 'Rare Kashmir White Acacia Blossom Honey',
    cat: 'honey',
    vol: '500 g',
    price: 650,
    mrpPrice: 780,
    rating: 5.0,
    reviewCount: 140,
    purityCoins: 65,
    soldCountLabel: '920+ sold',
    stock: 40,
    statusBadge: 'Ultra Pure & Clear',
    badges: ['Rare Reserve'],
    pi: 10,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '500 g', p: 650, mrp: 780, on: true },
      { s: '1 kg', p: 1200, mrp: 1450, on: false },
    ],
    description: 'Exceptionally light and mild acacia nectar harvested during early spring blossom. Doesn’t crystallize easily and retains fresh sweet undertones.'
  }
];

export const FocusHoneySection: React.FC<FocusHoneySectionProps> = ({
  products,
  onAddToCart,
  cartIds = []
}) => {
  const router = useRouter();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [justAddedMap, setJustAddedMap] = useState<Record<string, boolean>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const honeyProducts = useMemo(() => {
    const isHoney = (p: Product) => {
      const cat = p.cat?.toLowerCase() || '';
      const name = p.name?.toLowerCase() || '';
      const id = p.id?.toLowerCase() || '';
      return cat === 'honey' || name.includes('honey') || id.includes('honey');
    };

    let pool = products.filter(isHoney);
    if (pool.length < 5) {
      const existingIds = new Set(pool.map(p => p.id));
      const fallbacks = DEFAULT_HONEY.filter(d => !existingIds.has(d.id));
      pool = [...pool, ...fallbacks];
    }
    return pool;
  }, [products]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    setSelectedVariants(prev => ({ ...prev, [productId]: idx }));
  };

  return (
    <section className="py-6 sm:py-10 md:py-16 bg-[#FAF7F2] border-b border-[#EAE3D2] select-none">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12">
        
        {/* Title Header with See All Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-sm font-black text-[#6B5A45] tracking-[2px] sm:tracking-[2.5px] uppercase mb-0.5 sm:mb-1">
              Product In Focus
            </p>
            <h2 className="font-serif text-xl sm:text-3xl md:text-4xl font-extrabold text-[#0D3B2E] tracking-tight">
              Explore Our Raw Forest Honey
            </h2>
            <div className="w-12 sm:w-16 h-0.5 bg-[#0D3B2E]/20 mt-1.5 rounded-full mx-auto sm:mx-0" />
          </div>

          {/* See All Button redirecting to /category/honey */}
          <Link
            href="/category/honey"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-[#0D3B2E] text-[#0D3B2E] bg-white hover:bg-[#0D3B2E] hover:text-white transition-all text-xs sm:text-sm font-bold tracking-wide shadow-xs cursor-pointer group shrink-0 active:scale-95"
            aria-label="See all honey products"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel Container with Left/Right Arrows */}
        <div className="relative group/carousel mt-4 sm:mt-6">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Previous honey"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Next honey"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Scrollable Track matching reference layout */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex items-stretch gap-2.5 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-5 pt-1 px-1"
          >
            {honeyProducts.map((p) => {
              const varIdx = selectedVariants[p.id] || 0;
              const currentVar = Array.isArray(p.vars) && p.vars.length > varIdx ? p.vars[varIdx] : null;
              const displayPrice = currentVar?.p ? Number(currentVar.p) : Number(p.price) || 0;
              const rawMrp = currentVar?.mrp ? Number(currentVar.mrp) : Number(p.mrpPrice) || displayPrice;
              const displayMrp = rawMrp > displayPrice ? rawMrp : Math.round(displayPrice * 1.25);
              const rawDiscount = displayMrp > displayPrice && displayMrp > 0
                ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
                : 15;
              const discount = isNaN(rawDiscount) || rawDiscount <= 0 ? 15 : rawDiscount;
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
                        src={(p.imageUrls && p.imageUrls[0]) || '/images/products/honey_jar.jpg'}
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
                      {p.reviewCount || 120} review
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

                  {/* Variant Selection Pills */}
                  {Array.isArray(p.vars) && p.vars.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-gray-100">
                      {p.vars.map((v, i) => (
                        <button
                          key={v.s || i}
                          type="button"
                          onClick={(e) => handleVariantSelect(p.id, i, e)}
                          className={cn(
                            "text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                            varIdx === i
                              ? "bg-[#0D3B2E] text-white border-[#0D3B2E]"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                          )}
                        >
                          {v.s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(p.id, e)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-90"
                    aria-label="Save to wishlist"
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-colors",
                        wishlist[p.id] ? "fill-red-500 text-red-500" : "text-gray-400"
                      )}
                    />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scroll Progress Bar & See All Button */}
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
            href="/category/honey"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            aria-label="See all honey products"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Explore All Honey Link */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <Link
            href="/category/honey"
            prefetch={true}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#0D3B2E] text-[#0D3B2E] bg-white hover:bg-[#0D3B2E] hover:text-white transition-all text-xs sm:text-sm font-bold tracking-wide shadow-xs active:scale-95 cursor-pointer"
          >
            <span>Explore All Raw Forest Honey</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
