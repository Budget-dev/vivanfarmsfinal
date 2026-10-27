"use client";

import React from 'react';
import Image from 'next/image';
import { ShoppingBag, MessageCircle, Check, Plus, Minus } from 'lucide-react';

interface StickyMobileBarProps {
  productName: string;
  thumbnailUrl?: string;
  selectedSize: string;
  qty: number;
  pricePerUnit: number;
  mrpPerUnit?: number;
  cartCount?: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onUpdateCartQty?: (delta: number) => void;
  onOpenCart?: () => void;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({
  productName,
  thumbnailUrl,
  selectedSize,
  qty,
  pricePerUnit,
  mrpPerUnit = 0,
  cartCount = 0,
  onAddToCart,
  onBuyNow,
  onUpdateCartQty,
  onOpenCart,
}) => {
  const totalPrice = pricePerUnit * qty;

  return (
    <>
      {/* Floating WhatsApp Action Button */}
      <a
        href="https://wa.me/919217428737?text=Hi%20Vivaan%20Farms,%20I'd%20like%20to%20know%20more%20about%20your%20A2%20Desi%20Buffalo%20Ghee."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform md:hidden cursor-pointer"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white stroke-none" />
      </a>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DCD0] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden flex items-center justify-between gap-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
        
        {/* Left: Price & Selected Size */}
        <div className="flex items-center gap-2.5 min-w-0">
          {thumbnailUrl && (
            <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E9DFCF] overflow-hidden shrink-0 relative">
              <Image 
                src={thumbnailUrl} 
                alt={productName} 
                fill 
                className="object-cover" 
              />
            </div>
          )}

          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate max-w-[120px]">
              {selectedSize}
            </span>
            <span className="font-sans text-base font-extrabold text-[#111827] leading-tight">
              Rs. {totalPrice.toLocaleString('en-IN')}.00
            </span>
          </div>
        </div>

        {/* Right: Quantity in Cart Stepper or Add to Cart Button */}
        <div className="flex items-center gap-2 shrink-0">
          {cartCount > 0 ? (
            <div className="flex items-center bg-[#EBF5EE] border-2 border-[#2D6A4F] rounded-xl overflow-hidden h-11 shadow-xs">
              <button 
                type="button"
                onClick={() => onUpdateCartQty ? onUpdateCartQty(-1) : null} 
                className="w-10 h-full flex items-center justify-center text-[#0D3B2E] hover:bg-[#D4EDE0] active:bg-[#B8DFC9] transition-colors cursor-pointer"
                aria-label="Decrease quantity in cart"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              
              <button
                type="button"
                onClick={onOpenCart}
                className="px-3 h-full flex items-center justify-center gap-1.5 text-xs font-black text-[#0D3B2E] tracking-tight hover:underline cursor-pointer select-none"
                title="Open Cart"
              >
                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                <span>{cartCount} IN CART</span>
              </button>

              <button 
                type="button"
                onClick={() => onUpdateCartQty ? onUpdateCartQty(1) : onAddToCart()} 
                className="w-10 h-full flex items-center justify-center text-[#0D3B2E] hover:bg-[#D4EDE0] active:bg-[#B8DFC9] transition-colors cursor-pointer"
                aria-label="Increase quantity in cart"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={onAddToCart}
              className="h-11 px-5 bg-[#0D3B2E] text-white hover:bg-[#072B21] font-extrabold uppercase text-xs tracking-wider rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ADD TO CART</span>
            </button>
          )}
        </div>

      </div>
    </>
  );
};
