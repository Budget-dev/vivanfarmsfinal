"use client";

import React from 'react';
import Image from 'next/image';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount: number;
}

interface NavItem {
  id: string;
  label: string;
  iconSrc: string;
  badge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, cartCount }) => {
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      iconSrc: '/images/nav/home.png',
    },
    {
      id: 'shop',
      label: 'Shop',
      iconSrc: '/images/nav/shop.png',
    },
    {
      id: 'cart',
      label: 'Cart',
      iconSrc: '/images/nav/cart.png',
      badge: cartCount,
    },
    {
      id: 'account',
      label: 'Account',
      iconSrc: '/images/nav/account.png',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[28px] border-t border-[#E8ECE9] shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center transition-all duration-200 outline-none ${
                isActive
                  ? 'bg-[#EAF3ED] rounded-2xl px-4 py-1.5 shadow-sm'
                  : 'px-3 py-1.5 hover:opacity-85'
              }`}
            >
              {/* Icon Container with optional Badge */}
              <div className="relative w-7 h-7 flex items-center justify-center mb-0.5">
                <Image
                  src={item.iconSrc}
                  alt={item.label}
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain transition-transform duration-200"
                  priority
                />

                {/* Cart Badge */}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#14422B] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm border border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`font-serif font-semibold text-[13px] leading-tight tracking-tight transition-colors duration-200 ${
                  isActive ? 'text-[#14422B]' : 'text-[#7A5229]'
                }`}
              >
                {item.label}
              </span>

              {/* Active Underline Pill Indicator */}
              <span
                className={`block h-[3px] rounded-full mx-auto mt-1 transition-all duration-200 ${
                  isActive ? 'w-6 bg-[#14422B]' : 'w-6 opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
