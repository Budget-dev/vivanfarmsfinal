"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Leaf, Check } from 'lucide-react';
import { Product } from '@/types';
import { JarIcon, ComboIcon } from './JarIcon';
import { cn } from '@/lib/utils';

// Default descriptions by category for products missing a description
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  ghee: 'Pure A2 Gir Cow Bilona Ghee, hand-churned from farm-fresh curd using traditional methods.',
  honey: 'Raw unprocessed forest honey, ethically harvested from wild bee colonies in Gujarat.',
  sweets: 'Artisanal farm sweets made with pure A2 ghee, jaggery & love — no preservatives.',
  combo: 'Curated combo pack of our finest farm-fresh products at special savings.',
  default: 'Farm-fresh, naturally pure & crafted with tradition. No chemicals, no shortcuts.',
};

function getSmartDescription(product: Product): string {
  if (product.description && product.description.trim() && product.description.trim() !== product.name.trim()) {
    return product.description;
  }
  return CATEGORY_DESCRIPTIONS[product.cat] || CATEGORY_DESCRIPTIONS['default'];
}

interface ProductCardProps {
  product: Product;
  isInCart: boolean;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isInCart, onOpen, onAdd }) => {
  const router = useRouter();
  
  // Ensure we have numbers to work with
  const price = Number(product.price) || 0;
  const rawMrp = Number(product.mrpPrice) || price;
  const mrpPrice = rawMrp > price ? rawMrp : Math.round(price * 1.4);
  const discount = mrpPrice > 0 ? Math.round(((mrpPrice - price) / mrpPrice) * 100) : 0;
  const yourPrice = Math.round(price * 0.95);

  const description = getSmartDescription(product);

  const getIcon = () => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return (
        <div className="relative w-full h-full transition-transform duration-700 group-hover:scale-105">
          <Image 
            src={product.imageUrls[0]} 
            alt={product.name} 
            fill 
            className={cn(
              "object-cover transition-opacity duration-500",
              product.imageUrls.length > 1 ? "group-hover:opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 768px) 150px, 220px"
          />
          
          {product.imageUrls.length > 1 && (
            <Image 
              src={product.imageUrls[1]} 
              alt={`${product.name} alternate`} 
              fill 
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              sizes="(max-width: 768px) 150px, 220px"
            />
          )}
        </div>
      );
    }
    
    if (product.cat === 'combo') return <ComboIcon className="scale-75 md:scale-90" />;
    return (
      <JarIcon 
        c1={(product.pi ?? 0) % 2 === 0 ? '#D4EDE0' : '#EBF5EE'} 
        c2={(product.pi ?? 0) % 2 === 0 ? '#1B5E3B' : '#0D3520'} 
        sub="" 
        idSuffix={product.id} 
        className="scale-75 md:scale-90" 
      />
    );
  };

  const handleNavigate = () => {
    router.push(`/product/${product.id}`);
  };

  const [justAdded, setJustAdded] = React.useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div 
      onClick={handleNavigate}
      className="bg-white rounded-2xl border border-gray-200 hover:border-[#0D3B2E]/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group relative select-none p-2.5 sm:p-3 w-full mx-auto"
    >
      {/* Top-Left Hanging FLAT OFF Deep Green Badge */}
      <div className="absolute top-2 left-2 z-10 bg-[#143E31] text-white rounded-b-xl rounded-t-sm px-2 pt-1 pb-1.5 text-center shadow-xs flex flex-col items-center justify-center leading-none select-none pointer-events-none">
        <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-white">FLAT</span>
        <span className="text-[12px] sm:text-[13px] font-black tracking-tight text-[#EBB847] my-0.5">{discount}%</span>
        <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-white">OFF</span>
      </div>

      {/* Clean White Product Image Area */}
      <div className="relative w-full h-[155px] sm:h-[195px] md:h-[215px] flex items-center justify-center bg-white mt-1">
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {getIcon()}
        </div>
      </div>

      {/* Floating ADD Button aligned to the right */}
      <div className="flex justify-end -mt-3 relative z-10 mb-1">
        <button 
          type="button"
          onClick={handleAddClick}
          className={cn(
            "px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs active:scale-95",
            (justAdded || isInCart) 
              ? "bg-emerald-800 text-white" 
              : "bg-[#1D4A3E] text-white hover:bg-[#143E31]"
          )}
          aria-label={`Add ${product.name} to cart`}
        >
          <span>{justAdded ? 'ADDED' : isInCart ? 'IN CART' : 'ADD'}</span>
          {justAdded ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          )}
        </button>
      </div>

      {/* Title */}
      <h3 className="font-serif text-[13px] sm:text-[15px] font-bold text-[#111827] group-hover:text-[#0D3B2E] transition-colors line-clamp-2 min-h-[2.4em] leading-snug">
        {product.name}
      </h3>

      {/* Rating */}
      <div className="flex items-center gap-1.5 text-xs text-gray-700 mt-1 mb-1.5">
        <Star className="w-3.5 h-3.5 text-[#EAB308] fill-transparent stroke-[2.2] shrink-0" />
        <span className="text-[11.5px] sm:text-xs text-gray-700 font-normal">
          {product.reviewCount || 0} review
        </span>
      </div>

      {/* Strikethrough Price on Left, Selling Price on Right */}
      <div className="flex items-baseline gap-2.5 mt-0.5 mb-2">
        {mrpPrice > price && (
          <span className="text-xs sm:text-sm text-gray-400 line-through font-normal">
            ₹{mrpPrice.toLocaleString('en-IN')}
          </span>
        )}
        <span className="text-sm sm:text-base font-black text-black leading-none">
          ₹{price.toLocaleString('en-IN')}
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
            <span className="font-bold">MRP</span> ₹{mrpPrice.toLocaleString('en-IN')} + 5% extra prepaid incl.
          </p>
        </div>
      </div>
    </div>
  );
};
