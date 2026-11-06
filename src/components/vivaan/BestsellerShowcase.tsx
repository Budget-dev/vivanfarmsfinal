"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, ChevronDown, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface BestsellerShowcaseProps {
  products: Product[];
  cartIds: (string | number)[];
  onAddToCart: (product: Product, selectedVariant?: any) => void;
}

export const BestsellerShowcase: React.FC<BestsellerShowcaseProps> = ({
  products,
  cartIds,
  onAddToCart
}) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [isAdded, setIsAdded] = useState(false);

  // Filter or take star products (ghee, cold pressed oil, raw honey)
  const bestsellerProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    // Prioritize products with 'Bestseller' badge or category ghee
    const list = products.filter(p => 
      p.cat === 'ghee' || 
      p.cat === 'honey' || 
      p.name.toLowerCase().includes('oil') ||
      (p.badges && p.badges.includes('Bestseller'))
    );
    return list.length > 0 ? list.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  if (bestsellerProducts.length === 0) return null;

  const currentProduct = bestsellerProducts[currentIndex] || bestsellerProducts[0];
  const variants = Array.isArray(currentProduct.vars) && currentProduct.vars.length > 0
    ? currentProduct.vars
    : [{ s: currentProduct.vol || '500 ml', p: Number(currentProduct.price) || 0, mrp: Number(currentProduct.mrpPrice) || 0, on: true }];

  const currentVarIndex = selectedVariants[currentProduct.id] ?? 0;
  const activeVariant = variants[currentVarIndex] || variants[0];

  const price = Number(activeVariant?.p) || Number(currentProduct.price) || 0;
  const mrp = Number(activeVariant?.mrp) || Number(currentProduct.mrpPrice) || price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const isInCart = cartIds.some(cid => String(cid) === String(currentProduct.id));

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bestsellerProducts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bestsellerProducts.length) % bestsellerProducts.length);
  };

  const handleAdd = () => {
    const productToAdd: Product = {
      ...currentProduct,
      price: price,
      vol: activeVariant.s || currentProduct.vol || '500 ml'
    };
    onAddToCart(productToAdd, activeVariant);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  // Image source: if product has imageUrls use first, otherwise use our high-res home images
  const displayImage = currentProduct.imageUrls?.[0] || '';

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-[#FAF7F0] border-b border-[#EAE3D2]">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading matching screenshot */}
        <div className="text-center mb-6">
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#C85A32] tracking-tight">
            Our Bestsellers
          </h2>
          <div className="w-12 h-0.5 bg-[#C85A32]/30 mx-auto mt-2 rounded-full" />
        </div>

        {/* Featured Showcase Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E0D7C5] shadow-md hover:shadow-xl transition-all duration-300 relative">
          
          {/* Top Gold Badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1 bg-[#DF9F3D] text-white text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-md shadow-xs tracking-wider">
              <Award className="w-3.5 h-3.5" />
              TOP SELLER
            </span>
          </div>

          {/* High-Clarity Featured Image Area */}
          <div 
            onClick={() => router.push(`/product/${currentProduct.id}`)}
            className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#F7F3EA] overflow-hidden cursor-pointer"
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={currentProduct.name}
                fill
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 700px"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F4EFE6] text-[#143E31]">
                <Package className="w-16 h-16 stroke-[1.2] mb-2 text-emerald-800/50" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950/70">Pure Vedic Produce</span>
              </div>
            )}
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Product Details & Actions */}
          <div className="p-4 sm:p-6 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h3 
                onClick={() => router.push(`/product/${currentProduct.id}`)}
                className="font-headline text-base sm:text-xl font-bold text-[#1A1410] hover:text-[#0D3520] transition-colors cursor-pointer capitalize"
              >
                {currentProduct.name}
              </h3>
              
              {/* Price Row */}
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-2xl font-black text-[#0D3520]">
                  ₹{price.toLocaleString('en-IN')}.00
                </span>
                {mrp > price && (
                  <span className="text-xs sm:text-sm text-[#8C8275] line-through font-semibold">
                    ₹{mrp.toLocaleString('en-IN')}.00
                  </span>
                )}
              </div>
            </div>

            {/* Promo Tag */}
            <div>
              <span className="inline-block bg-[#E8F3EC] text-[#1B5E3B] text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-md border border-[#1B5E3B]/20">
                ⭐ {discount > 0 ? `SAVE ${discount}% · BESTSELLER BATCH` : 'BUY 2 GET 5% OFF WITH CODE VIVAAN5'}
              </span>
            </div>

            {/* Size Selector Dropdown & Add Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {/* Size Selector Dropdown matching screenshot */}
              <div className="relative sm:w-1/3">
                <select
                  value={currentVarIndex}
                  onChange={(e) => setSelectedVariants(prev => ({ ...prev, [currentProduct.id]: Number(e.target.value) }))}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#D8CEBA] hover:border-[#0D3520] rounded-xl py-3 pl-3 pr-8 text-xs sm:text-sm font-bold text-[#1A1410] focus:outline-none focus:ring-1 focus:ring-[#0D3520] cursor-pointer"
                >
                  {variants.map((v, idx) => (
                    <option key={idx} value={idx}>
                      {v.s || 'Standard'} — ₹{Number(v.p).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#5C4524] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Deep Green ADD TO CART Button */}
              <button
                type="button"
                onClick={handleAdd}
                className={cn(
                  "flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-sm border-none",
                  isAdded
                    ? "bg-[#1B5E3B] text-white"
                    : isInCart
                    ? "bg-[#2D6A4F] text-white hover:bg-[#1B5E3B]"
                    : "bg-[#0D3520] text-white hover:bg-[#1B4332]"
                )}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>ADDED TO CART</span>
                  </>
                ) : isInCart ? (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>IN CART · ADD ANOTHER</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>ADD TO CART</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots & Nav Arrows */}
        {bestsellerProducts.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handlePrev}
              aria-label="Previous Bestseller"
              className="w-8 h-8 rounded-full bg-white border border-[#E0D7C5] flex items-center justify-center text-[#0D3520] hover:bg-[#EAE3D2] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {bestsellerProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'w-6 bg-[#0D3520]' : 'w-2 bg-[#D8CEBA] hover:bg-[#0D3520]/50'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              aria-label="Next Bestseller"
              className="w-8 h-8 rounded-full bg-white border border-[#E0D7C5] flex items-center justify-center text-[#0D3520] hover:bg-[#EAE3D2] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
