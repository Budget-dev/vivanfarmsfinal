"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JarIcon, ComboIcon } from './JarIcon';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (id: string, vol: string, delta: number) => void;
  onRemove: (id: string, vol: string) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, cart, onUpdateQty, onRemove, onCheckout }) => {
  const router = useRouter();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
  const coinsReward = cart.reduce((sum, item) => {
    const itemReward = Number(item.purityCoins) || Number(item.rewardCoins) || Math.round((Number(item.price) || 0) * 0.1);
    return sum + (itemReward * (Number(item.qty) || 1));
  }, 0);
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = () => {
    const code = coupon.toUpperCase().trim();
    if (code === 'PURE15') {
      setDiscount(Math.round(subtotal * 0.15));
      setAppliedCoupon('PURE15');
    } else if (code === 'STAY20') {
      setDiscount(Math.round(subtotal * 0.20));
      setAppliedCoupon('STAY20');
    }
  };

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const renderItemImage = (item: CartItem) => {
    if (item.imageUrls && item.imageUrls.length > 0) {
      return (
        <div className="relative w-full h-full">
          <Image 
            src={item.imageUrls[0]} 
            alt={item.name} 
            fill 
            className="object-contain"
          />
        </div>
      );
    }
    
    if (item.cat === 'combo') return <ComboIcon className="scale-[0.6]" />;
    return <JarIcon c1="#D4EDE0" c2="#1B5E3B" sub="" idSuffix={`cart-${item.id}`} className="scale-[0.8]" />;
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1100] transition-opacity duration-300" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div 
        className={`fixed right-0 top-0 bottom-0 w-full sm:max-w-[460px] bg-[#F9F6EF] z-[1101] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
      >
        {/* Header with safe padding */}
        <div className="h-[64px] md:h-[76px] bg-[#0D3520] flex items-center justify-between px-5 md:px-6 shrink-0 relative overflow-hidden text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-secondary" />
            <div>
              <div className="font-headline text-xl md:text-2xl font-extrabold text-white leading-tight">My Cart</div>
              <div className="text-[10px] text-white/60 font-bold tracking-wider">{cart.length} {cart.length === 1 ? 'item' : 'items'}</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain">
          {cart.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Input 
                placeholder="🎁 Enter Coupon (e.g. PURE15)" 
                className="bg-white border-[#DDD0B5] rounded-full h-11 text-xs md:text-sm font-medium pl-4"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                suppressHydrationWarning
              />
              <Button 
                onClick={applyCoupon} 
                className="h-11 bg-[#0D3520] hover:bg-[#1B5E3B] rounded-full px-5 font-bold text-xs uppercase tracking-wider text-white shrink-0 cursor-pointer active:scale-95"
              >
                Apply
              </Button>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-12 md:py-20 flex flex-col items-center justify-center px-4">
              <div className="w-28 h-28 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-[#FBF6E5] rounded-full scale-[0.9]"></div>
                <div className="relative w-20 h-20">
                  <Image 
                    src="/empty-cart.png" 
                    alt="Empty Cart" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-[#100C06] mb-2">Your Cart is Empty</h3>
              <p className="text-xs md:text-sm text-[#7A6848] max-w-[280px] leading-relaxed font-medium mb-8">
                Explore our pure A2 Bilona Ghee and authentic farm products.
              </p>
              <Button 
                onClick={onClose} 
                className="bg-[#0D3520] hover:bg-[#1B5E3B] text-white px-8 h-12 rounded-full font-black text-xs uppercase tracking-[2px] transition-all shadow-md active:scale-95 border-none cursor-pointer"
              >
                Explore Products →
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.id}-${item.vol}`} className="bg-white border border-[#DDD0B5]/80 rounded-2xl p-3.5 md:p-4 flex gap-3.5 relative shadow-xs">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#F8F2E5] to-[#EDE4CF] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {renderItemImage(item)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-headline text-sm md:text-base font-bold text-foreground truncate capitalize">{item.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-[#7A6848] font-bold uppercase tracking-wider mb-2">
                      <span>{item.vol}</span>
                      <span>•</span>
                      <span className="text-amber-800 dark:text-amber-400 font-semibold">
                        🪙 {Number(item.purityCoins) || Number(item.rewardCoins) || Math.round((Number(item.price) || 0) * 0.1)} coins on delivery
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-base md:text-lg text-primary">₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                      
                      {/* Touch-optimized quantity stepper (min 36px tap target) */}
                      <div className="flex items-center bg-[#F9F6EF] border border-[#DDD0B5] rounded-xl overflow-hidden h-9">
                        <button 
                          onClick={() => onUpdateQty(item.id, item.vol, -1)} 
                          className="w-9 h-full flex items-center justify-center text-primary active:bg-[#EAE0CD] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-foreground">{item.qty}</span>
                        <button 
                          onClick={() => onUpdateQty(item.id, item.vol, 1)} 
                          className="w-9 h-full flex items-center justify-center text-primary active:bg-[#EAE0CD] transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(item.id, item.vol)} 
                    className="absolute top-2.5 right-2.5 p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-destructive transition-all cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary with Safe Area Padding */}
        {cart.length > 0 && (
          <div className="bg-white border-t border-[#DDD0B5] p-4 md:p-6 shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-semibold text-[#7A6848]">
                <span>Subtotal</span>
                <span className="text-foreground font-black">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>−₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {coinsReward > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-[#7A6848] bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <span className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                    <span>🪙</span>
                    <span>Purity Coins (Earned on Delivery)</span>
                  </span>
                  <span className="text-emerald-800 dark:text-emerald-400 font-black">+{coinsReward} Coins</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#F9F6EF] mb-4">
              <span className="text-sm font-black uppercase tracking-tight text-gray-700">Estimated Total</span>
              <span className="font-headline text-2xl md:text-3xl font-extrabold text-primary">₹{total.toLocaleString('en-IN')}</span>
            </div>

            <Button 
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full h-14 bg-gradient-to-br from-[#1B5E3B] to-[#0D3520] hover:from-[#14482D] hover:to-[#092617] rounded-full text-xs md:text-sm font-black uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Button>

            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full mt-3 h-12 border border-[#DDD0B5] hover:border-[#0D3520] bg-transparent hover:bg-[#F9F6EF] text-[#0D3520] rounded-full text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all shadow-xs"
            >
              Keep Shopping
            </Button>
          </div>
        )}
      </div>
    </>
  );
};