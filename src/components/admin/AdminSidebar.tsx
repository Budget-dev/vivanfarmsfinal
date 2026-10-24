"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-table-columns', href: '/admin' },
  { id: 'ghee', label: 'A2 Ghee', icon: 'fa-cow', href: '/admin/products/ghee' },
  { id: 'sweets', label: 'Sweets', icon: 'fa-gift', href: '/admin/products/sweets' },
  { id: 'honey', label: 'Honey', icon: 'fa-jar', href: '/admin/products/honey' },
  { id: 'reviews', label: 'Customer Reviews', icon: 'fa-star', href: '/admin/reviews' },
  { id: 'coupons', label: 'Coupons', icon: 'fa-ticket', href: '/admin/coupons' },
  { id: 'orders', label: 'Orders', icon: 'fa-cart-shopping', href: '/admin/orders' },
  { id: 'users', label: 'Users & Coins', icon: 'fa-users', href: '/admin/users' },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/admin/login');
    }
  };

  return (
    <aside className="w-[280px] bg-[#0F0F11] text-white flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 border-r border-white/5 font-body">
      <div className="p-6 pb-4">
        <Link href="/admin" className="flex flex-col gap-2 group">
          <div className="w-36 h-10 relative brightness-0 invert">
            <Image
              src="https://vivanfa.sirv.com/Group%2066%20(2).png"
              alt="Vivaan Farms Logo"
              fill
              className="object-contain object-left transition-transform group-hover:scale-105"
            />
          </div>
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[3px] pl-0.5">Admin Panel</span>
        </Link>
      </div>

      <div className="px-4 py-8 flex-1">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-6 px-4">Menu</div>
        <nav className="space-y-1.5">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group",
                  isActive 
                    ? "bg-[#1B5E3B] text-white shadow-lg shadow-black/20" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <i className={cn("fa-solid w-5 text-center", item.icon, isActive ? "text-white" : "text-white/20 group-hover:text-white/40")}></i>
                <span className="text-sm font-bold">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B5E3B] to-[#0D3520] flex items-center justify-center font-black text-xs">
              {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">Admin User</div>
              <div className="text-[9px] text-white/30 font-medium truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        </div>
        <div className="text-[10px] text-white/20 text-center font-medium">
          Vivaan Farms v2.5.0
        </div>
      </div>
    </aside>
  );
};
