"use client";

import React, { useState } from 'react';
import { 
  Minus, 
  Plus, 
  ChevronDown, 
  Truck, 
  ShieldCheck, 
  CreditCard,
  Check,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Product, ProductVariant } from '@/types';

interface ProductPurchasePaneProps {
  product: Product;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  qty: number;
  onQtyChange: (newQty: number) => void;
  cartCountForThisProduct: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onOpenCart?: () => void;
}

export const VIVAAN_BUFFALO_VARIANTS: ProductVariant[] = [];

export const ProductPurchasePane: React.FC<ProductPurchasePaneProps> = ({
  product,
  selectedSize,
  onSelectSize,
  qty,
  onQtyChange,
  cartCountForThisProduct,
  onAddToCart,
  onBuyNow,
  onOpenCart
}) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Use configured variants or reference defaults
  const vars: ProductVariant[] = Array.isArray(product?.vars) && product.vars.length > 0
    ? product.vars
    : [{ s: product?.vol || 'Standard', p: product?.price || 0, mrp: product?.mrpPrice || product?.price || 0, on: true }];

  // Helper to resolve variant price with fallback to product base price
  const getVariantPrice = (v?: ProductVariant): number => {
    if (!v) return product?.price || (product as any)?.basePrice || 0;
    const vp = Number(v.p);
    if (vp > 0) return vp;
    const legacyPrice = Number((v as any).price);
    if (legacyPrice > 0) return legacyPrice;
    if (product?.price > 0) return product.price;
    if ((product as any)?.basePrice && (product as any).basePrice > 0) return (product as any).basePrice;
    return 0;
  };

  const currentVar: ProductVariant = vars.find((v: ProductVariant) => v.s === selectedSize) || vars[0];
  const displayPrice = getVariantPrice(currentVar);
  const memberPrice = Math.round(displayPrice * 0.88); // 12% off for members matching reference

  // Calculate unit rate (per Liter or per Kilogram)
  const calculateUnitRate = (variantString: string, price: number): string | null => {
    if (!price || price <= 0) return null;
    const lower = variantString.toLowerCase();
    if (lower.includes('500ml') || lower.includes('500 ml')) return 'Rs. ' + Math.round(price * 2).toLocaleString('en-IN') + ' / L';
    if (lower.includes('500g') || lower.includes('500 g')) return 'Rs. ' + Math.round(price * 2).toLocaleString('en-IN') + ' / kg';
    if (lower.includes('250g') || lower.includes('250 g')) return 'Rs. ' + Math.round(price * 4).toLocaleString('en-IN') + ' / kg';
    if (lower.includes('250ml') || lower.includes('250 ml')) return 'Rs. ' + Math.round(price * 4).toLocaleString('en-IN') + ' / L';
    if (lower.includes('1kg') || lower.includes('1 kg')) return 'Rs. ' + price.toLocaleString('en-IN') + ' / kg';
    if (lower.includes('1l') && !lower.includes('15l')) return 'Rs. ' + price.toLocaleString('en-IN') + ' / L';
    if (lower.includes('2l')) return 'Rs. ' + (price / 2).toFixed(2).replace(/\.00$/, '') + ' / L';
    if (lower.includes('5l')) return 'Rs. ' + (price / 5).toFixed(2).replace(/\.00$/, '') + ' / L';
    if (lower.includes('15l')) return 'Rs. ' + (price / 15).toFixed(2).replace(/\.00$/, '') + ' / L';
    return null;
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => prev === id ? null : id);
  };

  const accordions = [
    {
      id: 'taste',
      title: 'WHY IT TASTES BETTER',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            Traditional Bilona ghee has a naturally sweet, nutty aroma and a distinct golden granular (danedar) texture that factory machine-made ghee can never duplicate.
          </p>
          <p>
            Because we slow-simmer hand-churned makkhan over gentle firewood in small batches, the milk solids caramelize organically, developing an irresistible rich flavor that elevates every dal, roti, and sweet.
          </p>
        </div>
      )
    },
    {
      id: 'inside',
      title: 'WHAT’S INSIDE',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>100% Pure Cultured Milk Fat</strong> derived exclusively from A2 indigenous buffalo milk.</li>
            <li><strong>Rich in Butyric Acid</strong> — a potent short-chain fatty acid that repairs gut lining and aids digestion.</li>
            <li><strong>Natural Fat-Soluble Vitamins</strong>: High concentrations of natural Vitamins A, D, E, and K2.</li>
            <li><strong>Zero Additives</strong>: No palm oil, no chemical preservatives, no synthetic colorants.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'made',
      title: 'HOW IT’S MADE',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>We preserve the sacred 5-step Vedic Bilona process:</p>
          <ol className="list-decimal pl-5 space-y-1.5 font-medium">
            <li><strong>Ethical Milking</strong>: Buffaloes graze freely in open pastures and are milked by hand with care.</li>
            <li><strong>Boiling & Culturing</strong>: Fresh milk is boiled gently and cultured overnight in mitti pots into whole-curd dahi.</li>
            <li><strong>Bi-directional Churning</strong>: Cultured curd is churned with wooden bilona to separate raw makkhan.</li>
            <li><strong>Slow Firewood Simmering</strong>: The makkhan is slow-cooked over firewood until clear golden ghee crystals form.</li>
            <li><strong>Airtight Glass Packing</strong>: Strained through fine muslin cloth directly into food-grade glass jars.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'results',
      title: 'RESULTS YOU’LL NOTICE',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Smooth, Easy Digestion</strong>: Extremely gentle on the stomach without post-meal lethargy.</li>
            <li><strong>Sustained Daily Stamina</strong>: Clean healthy fats fuel deep brain function and cellular energy.</li>
            <li><strong>Enhanced Nutrient Bioavailability</strong>: Fat-soluble nutrients from spices and herbs absorb up to 3x better.</li>
            <li><strong>Glowing Skin & Joint Lubrication</strong>: Natural Ayurvedic lubrication from within.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'care',
      title: 'COOKING & CARE',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            <strong>Storage</strong>: Store at room temperature in a dry place. Always use a clean, dry spoon. Does not require refrigeration.
          </p>
          <p>
            <strong>High Smoke Point</strong>: Smoke point of 250°C (482°F) makes it ideal for roasting, sautéing, tadka, and frying without smoke or oxidation.
          </p>
          <p>
            <strong>Granular Texture</strong>: Naturally granulates in cooler conditions and liquefies in warmth — proof of 100% pure authentic bilona ghee.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col space-y-4">
      
      {/* 1. Pill Badge & Title & Price (Exact match to reference screenshots) */}
      <div>
        <span className="inline-block bg-[#F8D279] text-[#1E293B] font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          Creamy
        </span>

        <h1 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-[#B93826] tracking-tight leading-tight capitalize">
          {product.name || 'A2 Desi Buffalo Ghee'}
        </h1>

        <div className="font-sans font-black text-2xl sm:text-3xl text-[#111827] mt-1.5">
          Rs. {displayPrice.toLocaleString('en-IN')}.00
        </div>
      </div>

      {/* 2. Membership Price Banner & Scalloped Guarantee Seal */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 bg-[#E2F0D9] border border-[#B8D7A3] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#143D24]">
            Members Price <span className="font-extrabold text-sm text-[#0D3B2E]">Rs. {memberPrice.toLocaleString('en-IN')}.00</span>
          </span>
          <button 
            type="button"
            className="text-[#0D3B2E] font-black underline hover:text-emerald-900 cursor-pointer"
          >
            Join Membership
          </button>
        </div>

        {/* Traditional Bilona Seal Graphic */}
        <div className="shrink-0 w-12 h-12 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#2D6A4F]">
            <path
              d="M50 0 C53 10 60 10 65 5 C69 15 76 17 83 14 C84 24 92 29 97 30 C94 40 99 47 100 50 C99 53 94 60 97 70 C92 71 84 76 83 86 C76 83 69 85 65 95 C60 90 53 90 50 100 C47 90 40 90 35 95 C31 85 24 83 17 86 C16 76 8 71 3 70 C6 60 1 53 0 50 C1 47 6 40 3 30 C8 29 16 24 17 14 C24 17 31 15 35 5 C40 10 47 10 50 0 Z"
              fill="#D4E9DE"
              stroke="#2D6A4F"
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="34" fill="#F8D279" stroke="#B8860B" strokeWidth="1.5" />
            <text x="50" y="46" textAnchor="middle" fontSize="10" fontWeight="900" fill="#3E2723">100%</text>
            <text x="50" y="58" textAnchor="middle" fontSize="8" fontWeight="800" fill="#3E2723">BILONA</text>
            <text x="50" y="68" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#2E7D32">PURE A2</text>
          </svg>
        </div>
      </div>

      {/* 3. 100% Money Back Guaranteed Box */}
      <div className="bg-[#FDF4DD] border border-[#F6E3B4] rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 font-sans font-black text-xs sm:text-sm text-[#5C3D00]">
          <span className="text-base">💰</span>
          <span>100% Money Back Guaranteed</span>
        </div>
        <p className="text-xs text-[#5C3D00]/90 mt-1 leading-relaxed">
          Try it first. Every pack includes a Free 20ml tasting sample. If it doesn’t meet your expectations, return it for a full 100% refund.
        </p>
      </div>

      {/* 4. Variant Selection Cards */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {vars.map((v: ProductVariant, idx: number) => {
            const isSelected = selectedSize === v.s;
            const variantPrice = getVariantPrice(v);
            const unitRate = calculateUnitRate(v.s, variantPrice);
            
            let badgeText: string | null = null;
            let badgeBg = 'bg-black text-white';
            
            if (v.s.toLowerCase().includes('1l') && !v.s.toLowerCase().includes('2l')) {
              badgeText = 'BESTSELLER';
              badgeBg = 'bg-[#111827] text-white';
            } else if (v.s.toLowerCase().includes('5l')) {
              badgeText = 'BEST VALUE';
              badgeBg = 'bg-[#F8D279] text-[#1E293B]';
            }

            return (
              <button
                key={v.s}
                type="button"
                onClick={() => onSelectSize(v.s)}
                className={cn(
                  "relative p-2 sm:p-3 rounded-xl text-center transition-all border-2 flex flex-col justify-between cursor-pointer active:scale-[0.98]",
                  isSelected
                    ? "bg-[#D4E9DE] border-[#2D6A4F] text-[#0D3B2E] shadow-xs"
                    : "bg-white border-[#E5DCD0] text-gray-800 hover:border-[#2D6A4F]/60"
                )}
              >
                {badgeText && (
                  <span className={cn(
                    "absolute -top-2 left-1/2 -translate-x-1/2 text-[7.5px] sm:text-[8px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap",
                    badgeBg
                  )}>
                    {badgeText}
                  </span>
                )}

                <div className="w-full">
                  <div className="text-[11px] sm:text-xs font-bold truncate">
                    {v.s}
                  </div>
                  <div className="text-[11px] sm:text-xs font-extrabold mt-0.5 sm:mt-1 text-[#111827]">
                    Rs. {variantPrice.toLocaleString('en-IN')}.00
                  </div>
                  {unitRate && (
                    <div className="text-[9px] sm:text-[10px] text-gray-600 font-medium mt-0.5 truncate">
                      {unitRate}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Stepper + ADD TO CART & Full-width BUY NOW */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2.5">
          {/* Stepper */}
          <div className="w-[110px] sm:w-[130px] h-[48px] shrink-0 bg-white rounded-xl border border-gray-300 px-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-black rounded-lg cursor-pointer active:scale-90"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="font-sans text-sm font-black text-gray-900 select-none">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onQtyChange(Math.min(99, qty + 1))}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-black rounded-lg cursor-pointer active:scale-90"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Add to Cart button */}
          {cartCountForThisProduct > 0 ? (
            <Button
              type="button"
              onClick={onAddToCart}
              className="flex-1 h-[48px] bg-[#EBF5EE] border-2 border-[#2D6A4F] text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white rounded-xl font-extrabold uppercase text-xs tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
              <span>{cartCountForThisProduct} IN CART • ADD MORE</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onAddToCart}
              className="flex-1 h-[48px] bg-white border-2 border-[#0D3B2E] text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white rounded-xl font-extrabold uppercase text-xs tracking-wider transition-all cursor-pointer shadow-xs"
            >
              ADD TO CART
            </Button>
          )}
        </div>

        {cartCountForThisProduct > 0 && onOpenCart && (
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={onOpenCart}
              className="text-xs font-bold text-[#0D3B2E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View In Cart ({cartCountForThisProduct} added) →</span>
            </button>
          </div>
        )}

        {/* BUY NOW Button with Payment Icons */}
        <button
          type="button"
          onClick={onBuyNow}
          className="w-full h-[50px] bg-[#0D3B2E] hover:bg-[#072B21] text-white rounded-xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-[0.99]"
        >
          <span>BUY NOW</span>
          <div className="flex items-center gap-1.5 opacity-90">
            {/* Google Pay Pill */}
            <span className="bg-white text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">GPay</span>
            {/* PhonePe / UPI */}
            <span className="bg-white text-[#5F259F] text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">UPI</span>
            {/* Cards */}
            <span className="bg-white text-[#1A1F71] text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">VISA</span>
          </div>
        </button>
      </div>

      {/* 6. Value Props Banner (3 Columns: Shipping, Security, COD) */}
      <div className="bg-[#FCEBCB] border border-[#F4DCB0] rounded-xl py-3 px-2 grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center justify-center">
          <Truck className="w-4 h-4 text-[#C05621] mb-1" />
          <span className="text-[10px] font-black text-gray-800 leading-tight">Free Shipping</span>
          <span className="text-[9px] text-gray-600 font-medium">Above ₹699</span>
        </div>
        <div className="flex flex-col items-center justify-center border-x border-[#EDD19D]">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32] mb-1" />
          <span className="text-[10px] font-black text-gray-800 leading-tight">Secure</span>
          <span className="text-[9px] text-gray-600 font-medium">Payments</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <CreditCard className="w-4 h-4 text-[#D69E2E] mb-1" />
          <span className="text-[10px] font-black text-gray-800 leading-tight">COD</span>
          <span className="text-[9px] text-gray-600 font-medium">Available</span>
        </div>
      </div>

      {/* 7. Product Description & Bullet Points (Exact match to reference screenshots) */}
      <div className="space-y-3 pt-2">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-relaxed">
          Experience the richest, most satisfying ghee India has ever produced.
        </p>

        <ul className="space-y-2 text-xs text-gray-800 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-black font-extrabold text-sm leading-none">•</span>
            <span>Hand-churned curd, slow-cooked in earthen pots using the ancient Bilona method</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black font-extrabold text-sm leading-none">•</span>
            <span>Thick, creamy texture with an intense aroma that fills the kitchen</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black font-extrabold text-sm leading-none">•</span>
            <span>Made in small batches by village women, never in a factory</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black font-extrabold text-sm leading-none">•</span>
            <span>Made after you order — reaches you within 14 days of leaving the farm</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black font-extrabold text-sm leading-none">•</span>
            <span>100% pure — no additives, no shortcuts, no compromise</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black font-extrabold text-sm leading-none">•</span>
            <span>Sourced from the milk of <strong>naturally raised Indian buffaloes</strong></span>
          </li>
        </ul>
      </div>

      {/* 8. Accordions (Exact uppercase headers matching reference screenshots) */}
      <div className="space-y-1.5 pt-3 border-t border-gray-200">
        {accordions.map((acc) => {
          const isOpen = openAccordion === acc.id;
          return (
            <div key={acc.id} className="border-b border-gray-200 py-2.5">
              <button
                type="button"
                onClick={() => toggleAccordion(acc.id)}
                className="w-full text-left flex items-center justify-between gap-3 font-sans font-bold text-xs tracking-wider uppercase text-gray-900 hover:text-[#0D3B2E] transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <span>{acc.title}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-gray-600 transition-transform duration-200",
                  isOpen && "rotate-180 text-[#0D3B2E]"
                )} />
              </button>

              {isOpen && (
                <div className="pt-2 pb-1">
                  {acc.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
