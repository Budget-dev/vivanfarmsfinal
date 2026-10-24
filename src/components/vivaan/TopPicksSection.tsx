"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Sparkles, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { JarIcon, ComboIcon } from './JarIcon';

interface TopPicksSectionProps {
  products: Product[];
  isLoading: boolean;
  cartIds: (string | number)[];
  onAddToCart: (product: Product, selectedVariant?: any) => void;
  onViewAll?: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'ghee', label: 'VEDIC GHEE' },
  { id: 'sweets', label: 'FARM SWEETS' }
];

export const TopPicksSection: React.FC<TopPicksSectionProps> = ({
  products,
  isLoading,
  cartIds,
  onAddToCart,
  onViewAll
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Track selected variant size per product ID
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  // Track just-added state for button feedback
  const [justAddedMap, setJustAddedMap] = useState<Record<string, boolean>>({});

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    if (activeTab === 'oils') {
      return products.filter(p => p.cat === 'oils' || p.name.toLowerCase().includes('oil'));
    }
    return products.filter(p => p.cat === activeTab);
  }, [products, activeTab]);

  const handleVariantChange = (productId: string, variantIndex: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setSelectedVariants(prev => ({ ...prev, [productId]: variantIndex }));
  };

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const variantIndex = selectedVariants[product.id] ?? 0;
    const variant = Array.isArray(product.vars) && product.vars.length > variantIndex 
      ? product.vars[variantIndex] 
      : null;

    const productToAdd: Product = {
      ...product,
      price: variant?.p ? Number(variant.p) : Number(product.price) || 0,
      vol: variant?.s || product.vol || '500 ml'
    };

    onAddToCart(productToAdd, variant);

    setJustAddedMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setJustAddedMap(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <section className="py-6 sm:py-10 md:py-14 bg-[#F9F6EF] border-b border-[#EAE3D2]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 md:px-10">
        
        {/* Section Header matching Reference Screenshot */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#1B5E3B] bg-[#E8F3EC] px-3 py-1 rounded-full border border-[#1B5E3B]/20 mb-1.5 shadow-xs">
            <span className="text-sm">🌱</span>
            <span>PURE & FRESH</span>
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#C85A32] tracking-tight">
            Top Picks For You
          </h2>
          <div className="w-12 h-0.5 bg-[#C85A32]/30 mx-auto mt-2 rounded-full" />
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-2 mb-5 px-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black tracking-wider transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 select-none",
                  isActive
                    ? "bg-[#0D3520] text-white shadow-sm"
                    : "bg-[#F3EAD8] text-[#5C4524] hover:bg-[#EBE0CB] border border-[#DECDB0]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Mobile / 4-Column Desktop Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse border border-[#EAE3D2]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 items-stretch">
            {filteredProducts.map((p) => {
              const variants = Array.isArray(p.vars) && p.vars.length > 0 
                ? p.vars 
                : [{ s: p.vol || '500 ml', p: Number(p.price) || 0, mrp: Number(p.mrpPrice) || 0, on: true }];
              
              const currentVarIndex = selectedVariants[p.id] ?? 0;
              const currentVariant = variants[currentVarIndex] || variants[0];
              
              const activePrice = Number(currentVariant?.p) || Number(p.price) || 0;
              const activeMrp = Number(currentVariant?.mrp) || Number(p.mrpPrice) || activePrice;
              const discount = activeMrp > activePrice 
                ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) 
                : 0;
              const savingsAmount = activeMrp > activePrice ? activeMrp - activePrice : 0;

              const isAdded = justAddedMap[p.id];
              const isInCart = cartIds.some(cid => String(cid) === String(p.id));

              const badgeText = p.badges && p.badges.length > 0 
                ? p.badges[0] 
                : (p.cat === 'ghee' ? 'Bestseller' : 'Natural');

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/product/${p.id}`)}
                  className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-[#E5DFD3] hover:border-[#0D3520]/30 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between group cursor-pointer relative"
                >
                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-[#DF9F3D] text-white text-[8px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs tracking-wider">
                      {badgeText}
                    </span>
                  </div>

                  {/* Product Image Area */}
                  <div className="relative aspect-square w-full bg-[#FAF7F2] p-2 sm:p-4 flex items-center justify-center overflow-hidden border-b border-[#F0EBE0] shrink-0">
                    {p.imageUrls && p.imageUrls.length > 0 ? (
                      <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
                        <Image
                          src={p.imageUrls[0]}
                          alt={p.name}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 768px) 180px, 280px"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <JarIcon className="scale-75 md:scale-90" c1="#F4E8D3" c2="#0D3520" sub="" idSuffix={p.id} />
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
                    <div>
                      {/* Product Name */}
                      <h3 className="font-headline text-xs sm:text-sm md:text-base font-bold text-[#1A1410] leading-snug line-clamp-2 group-hover:text-[#0D3520] transition-colors capitalize">
                        {p.name}
                      </h3>

                      {/* Pricing Row */}
                      <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-sm sm:text-base md:text-lg font-black text-[#0D3520]">
                          ₹{activePrice.toLocaleString('en-IN')}.00
                        </span>
                        {activeMrp > activePrice && (
                          <span className="text-[10px] sm:text-xs text-[#8C8275] line-through font-semibold">
                            ₹{activeMrp.toLocaleString('en-IN')}.00
                          </span>
                        )}
                      </div>

                      {/* Savings Pill matching Screenshot */}
                      {savingsAmount > 0 && (
                        <div className="mt-1">
                          <span className="inline-block bg-[#E8F3EC] text-[#1B5E3B] text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-sm">
                            Save ₹{savingsAmount} ({discount}% OFF)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Variant Dropdown & Add Button Row */}
                    <div className="pt-2 mt-auto space-y-2">
                      {/* Size Dropdown Selector matching Reference Screenshot [ 500 ml ▾ ] */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={currentVarIndex}
                          onChange={(e) => handleVariantChange(p.id, Number(e.target.value), e)}
                          className="w-full appearance-none bg-[#FAF7F2] border border-[#D8CEBA] hover:border-[#0D3520] rounded-lg py-1.5 pl-2.5 pr-7 text-[10px] sm:text-xs font-bold text-[#1A1410] focus:outline-none focus:ring-1 focus:ring-[#0D3520] cursor-pointer"
                        >
                          {variants.map((v, idx) => (
                            <option key={idx} value={idx}>
                              {v.s || 'Standard'} — ₹{Number(v.p).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#5C4524] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Full-Width ADD TO CART Button */}
                      <button
                        type="button"
                        onClick={(e) => handleAdd(p, e)}
                        className={cn(
                          "w-full py-2.5 sm:py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-xs border-none",
                          isAdded
                            ? "bg-[#1B5E3B] text-white"
                            : isInCart
                            ? "bg-[#2D6A4F] text-white hover:bg-[#1B5E3B]"
                            : "bg-[#0D3520] text-white hover:bg-[#1B4332]"
                        )}
                        aria-label={`Add ${p.name} to cart`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                            <span>ADDED</span>
                          </>
                        ) : isInCart ? (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>IN CART</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>ADD TO CART</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Link matching screenshot */}
        <div className="mt-6 text-center">
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#0D3520] hover:text-[#C85A32] transition-colors uppercase tracking-wider underline decoration-2 underline-offset-4"
          >
            <span>view all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
};
