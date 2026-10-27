"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Star, 
  TicketPercent, 
  Users, 
  FolderTree, 
  ExternalLink, 
  LogOut, 
  Sparkles, 
  Milk, 
  Droplets,
  Flame,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    ],
  },
  {
    title: 'Product Catalog',
    items: [
      { id: 'all-products', label: 'All Catalog', icon: Package, href: '/admin/products' },
      { id: 'ghee', label: 'A2 Vedic Ghee', icon: Milk, href: '/admin/products/ghee' },
      { id: 'sweets', label: 'Farm Sweets', icon: Sparkles, href: '/admin/products/sweets' },
      { id: 'honey', label: 'Raw Honey', icon: Droplets, href: '/admin/products/honey' },
      { id: 'categories', label: 'Categories', icon: FolderTree, href: '/admin/categories' },
    ],
  },
  {
    title: 'Store Operations',
    items: [
      { id: 'orders', label: 'Orders & Shipments', icon: ShoppingBag, href: '/admin/orders' },
      { id: 'reviews', label: 'Customer Reviews', icon: Star, href: '/admin/reviews' },
      { id: 'coupons', label: 'Discounts & Coupons', icon: TicketPercent, href: '/admin/coupons' },
      { id: 'users', label: 'Users & Purity Coins', icon: Users, href: '/admin/users' },
    ],
  },
];

interface AdminSidebarContentProps {
  isMobile?: boolean;
}

export const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ isMobile }) => {
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

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-zinc-900/80">
        <Link href="/admin" className="flex items-center justify-between gap-3 group">
          <div className="relative h-8 w-36">
            <Image
              src="/images/logo-white.png"
              alt="Vivaan Farms"
              fill
              className="object-contain object-left"
            />
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-1.5 py-0 h-4 shrink-0">
            Admin
          </Badge>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {section.title}
            </h3>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/40"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant || "secondary"}
                        className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-zinc-900/80 bg-zinc-950/60">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8 ring-1 ring-zinc-700">
              <AvatarFallback className="bg-emerald-800 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">Administrator</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">{user?.email || 'admin@vivaan.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-[11px] font-medium border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Link href="/" target="_blank">
                <ExternalLink className="mr-1.5 h-3 w-3" />
                Store
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="h-8 text-[11px] font-medium bg-red-950/50 hover:bg-red-900 text-red-200 border border-red-900/40"
            >
              <LogOut className="mr-1.5 h-3 w-3" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mt-2 text-center text-[10px] text-zinc-600 font-mono">
          Vivaan Enterprise v3.0
        </div>
      </div>
    </div>
  );
};

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex w-64 lg:w-72 shrink-0 h-screen sticky top-0 border-r border-zinc-800/80 shadow-xl z-30">
      <AdminSidebarContent />
    </aside>
  );
};
