"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Search, 
  User, 
  UserPlus,
  X, 
  LogOut, 
  Package, 
  Menu,
  Info,
  Phone,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LoginModal } from './LoginModal';

interface HeaderProps {
  onOpenCart: () => void;
  cartCount: number;
  onFilter: (cat: string) => void;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, cartCount, onFilter, onSearch }) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isSignUpMode, setSignUpMode] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();

  const handleOpenSignIn = () => {
    setSignUpMode(false);
    setLoginOpen(true);
  };

  const handleOpenSignUp = () => {
    setSignUpMode(true);
    setLoginOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleCategoryNav = (cat: string) => {
    router.push(`/category/${cat}`);
    onFilter?.(cat);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'All Products', slug: 'all', onClick: () => handleCategoryNav('all') },
    { label: 'A2 Desi Ghee', slug: 'ghee', onClick: () => handleCategoryNav('ghee') },
    { label: 'Homemade Sweets', slug: 'sweets', onClick: () => handleCategoryNav('sweets') },
    { label: 'Raw Forest Honey', slug: 'honey', onClick: () => handleCategoryNav('honey') },
    { label: 'Cold Pressed Oils', slug: 'oils', onClick: () => handleCategoryNav('oils') },
    { label: 'Healthy Combos', slug: 'combos', onClick: () => handleCategoryNav('combos') },
  ];

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-primary/5">
      <div className="max-w-[1500px] mx-auto px-4 md:px-10 h-[64px] md:h-[90px] flex items-center justify-between gap-2">
        
        <div className="md:hidden w-10 flex justify-start">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-primary/80 hover:bg-primary/5 rounded-full transition-all cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex justify-center md:justify-start h-full items-center">
          <Link href="/" className="flex items-center shrink-0 group relative py-1" aria-label="Vivaan Farms Home">
            {/* Brand Logo */}
            <div className="relative h-9 sm:h-11 md:h-13 w-[120px] sm:w-[145px] md:w-[170px] flex items-center">
              <Image
                src="https://vivanfa.sirv.com/Group%2066%20(2).png"
                alt="Vivaan Farms"
                fill
                priority
                sizes="(max-width: 640px) 120px, (max-width: 768px) 145px, 170px"
                className="object-contain object-left transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-8 mx-4">
          <button 
            onClick={() => handleCategoryNav('all')}
            className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase cursor-pointer"
          >
            All Products
          </button>
          <button 
            onClick={() => handleCategoryNav('ghee')}
            className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase cursor-pointer"
          >
            A2 Desi Ghee
          </button>
          <button 
            onClick={() => handleCategoryNav('sweets')}
            className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase cursor-pointer"
          >
            Sweets
          </button>
          <button 
            onClick={() => handleCategoryNav('honey')}
            className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase cursor-pointer"
          >
            Raw Honey
          </button>
          <button 
            onClick={() => handleCategoryNav('oils')}
            className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase cursor-pointer"
          >
            Wood-Pressed Oils
          </button>
          <button 
            onClick={() => handleCategoryNav('combos')}
            className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase cursor-pointer"
          >
            Combos
          </button>
          <Link href="/about" className="text-[13px] font-extrabold text-[#0D3B2E] hover:text-[#2D6A4F] transition-all tracking-wider uppercase">
            Our Story
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-1.5 md:gap-4 w-auto">
          <div className="relative">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center animate-in slide-in-from-right-4 duration-300 z-10" suppressHydrationWarning>
                <Input 
                  autoFocus
                  className="w-[180px] md:w-[260px] h-10 rounded-full border-primary/10 pl-4 pr-10 text-sm bg-white shadow-lg"
                  placeholder="Search pure..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  suppressHydrationWarning
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-3 text-primary/40 hover:text-primary" suppressHydrationWarning>
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center text-primary/80 hover:text-primary hover:bg-primary/5 rounded-full transition-all cursor-pointer" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* User Profile / Auth Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
                aria-label="My Account"
              >
                {user ? (
                  <div className="text-sm font-black text-primary">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-primary" />}
                  </div>
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              sideOffset={12} 
              className="w-[280px] rounded-3xl p-5 bg-white shadow-2xl border border-gray-100 z-[1000] relative animate-in fade-in-80 zoom-in-95"
            >
              {/* Pointer Triangle */}
              <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white rotate-45 border-t border-l border-gray-100 pointer-events-none" />

              {user ? (
                <>
                  <div className="text-center pb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Signed In As</div>
                    <div className="text-base font-bold text-primary truncate px-2 mt-0.5">{user.displayName || 'Valued Customer'}</div>
                    <div className="text-xs text-gray-500 truncate px-2">{user.email}</div>
                    <div className="w-8 h-0.5 bg-gray-200 rounded-full mx-auto mt-2" />
                  </div>

                  <DropdownMenuItem 
                    onClick={() => router.push('/track')} 
                    className="rounded-2xl p-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 flex items-center gap-3.5 transition-all my-1 group"
                  >
                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center shrink-0 text-primary group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">Track My Order</div>
                      <div className="text-xs text-gray-500 font-normal">Check delivery status</div>
                    </div>
                  </DropdownMenuItem>

                  <div className="border-b border-gray-100 my-2" />

                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="rounded-2xl p-3 cursor-pointer hover:bg-destructive/5 focus:bg-destructive/5 flex items-center gap-3.5 transition-all my-1 group text-destructive"
                  >
                    <div className="w-10 h-10 rounded-full border border-destructive/20 flex items-center justify-center shrink-0 text-destructive group-hover:bg-destructive/10 transition-colors">
                      <LogOut className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-destructive">Sign Out</div>
                      <div className="text-xs text-destructive/70 font-normal">Log out of account</div>
                    </div>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <div className="text-center pb-3">
                    <div className="text-base font-bold text-[#1a3322]">My Account</div>
                    <div className="w-8 h-0.5 bg-gray-200 rounded-full mx-auto mt-2" />
                  </div>

                  <DropdownMenuItem 
                    onClick={handleOpenSignIn} 
                    className="rounded-2xl p-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 flex items-center gap-3.5 transition-all my-1 group"
                  >
                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center shrink-0 text-[#1a3322] group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                      <User className="w-5 h-5 text-[#1a3322]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">Sign In</div>
                      <div className="text-xs text-gray-500 font-normal">Access your account</div>
                    </div>
                  </DropdownMenuItem>

                  <div className="border-b border-gray-100 my-2" />

                  <DropdownMenuItem 
                    onClick={handleOpenSignUp} 
                    className="rounded-2xl p-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 flex items-center gap-3.5 transition-all my-1 group"
                  >
                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center shrink-0 text-[#1a3322] group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                      <UserPlus className="w-5 h-5 text-[#1a3322]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">Create Account</div>
                      <div className="text-xs text-gray-500 font-normal">New here? Sign up</div>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button onClick={onOpenCart} className="group relative flex items-center justify-center w-9 h-9 md:w-auto md:px-2 text-primary/80 hover:text-primary transition-all cursor-pointer" aria-label="Shopping Cart">
            <ShoppingCart className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black rounded-full min-w-[15px] h-[15px] flex items-center justify-center border border-white">
              {cartCount}
            </div>
            <span className="hidden lg:inline ml-2 text-[11px] font-black tracking-widest">CART</span>
          </button>
        </div>
      </div>

      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-none bg-[#FDFBFA]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="h-full flex flex-col">
            <div className="p-6 pt-7 bg-primary text-white relative overflow-hidden shrink-0">
              <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                {/* Mobile Menu Brand Signature */}
                <div className="w-40 h-12 relative brightness-0 invert">
                   <Image 
                    src="https://vivanfa.sirv.com/Group%2066%20(2).png"
                    alt="Vivaan Farms"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </div>
              
              {user ? (
                <div className="relative z-10 text-left">
                  <div className="text-xs font-semibold text-white/70">Welcome back,</div>
                  <div className="text-base font-headline font-extrabold truncate text-white">{user.displayName || 'Farmer'}</div>
                </div>
              ) : (
                <div className="text-left relative z-10">
                  <div className="text-xs font-semibold text-white/80 mb-3">Welcome to Vivaan Farms</div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { handleOpenSignIn(); setMobileMenuOpen(false); }}
                      className="h-10 px-4 rounded-full bg-white text-primary text-xs font-black uppercase tracking-wider shadow hover:bg-white/90 transition-all flex-1 text-center flex items-center justify-center cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => { handleOpenSignUp(); setMobileMenuOpen(false); }}
                      className="h-10 px-4 rounded-full bg-[#E5A83B] text-white text-xs font-black uppercase tracking-wider shadow hover:bg-[#d5982b] transition-all flex-1 text-center flex items-center justify-center cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-6">
              <div className="px-6 mb-6">
                <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-[3px] mb-3 text-left">Store Collections</div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button 
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-primary/5 transition-all group cursor-pointer"
                    >
                      <span className="text-sm font-bold text-primary/80 group-hover:text-primary">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-primary/20 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 mb-6">
                <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-[3px] mb-3 text-left">Account</div>
                {user ? (
                  <div className="space-y-1">
                    <Link 
                      href="/track" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-primary/5 transition-all group"
                    >
                      <Package className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                      <span className="text-sm font-bold text-primary/80 group-hover:text-primary">Track My Order</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => { handleOpenSignIn(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-primary/10 hover:bg-primary/5 transition-all group text-left cursor-pointer"
                    >
                      <span className="text-sm font-bold text-primary">Sign In</span>
                      <ChevronRight className="w-4 h-4 text-primary/40 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => { handleOpenSignUp(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all group text-left cursor-pointer"
                    >
                      <span className="text-sm font-bold text-primary">Sign Up / Register</span>
                      <ChevronRight className="w-4 h-4 text-primary/60 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>

              <div className="px-6 mb-6">
                <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-[3px] mb-3 text-left">Discovery</div>
                <div className="space-y-1">
                  <Link 
                    href="/about" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-primary/5 transition-all group"
                  >
                    <Info className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-bold text-primary/80 group-hover:text-primary">About Us</span>
                  </Link>
                  <Link 
                    href="/contact" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-primary/5 transition-all group"
                  >
                    <Phone className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-bold text-primary/80 group-hover:text-primary">Contact Us</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-primary/5">
              <div className="bg-[#EBF5EE] p-4 rounded-[20px] text-center mb-4">
                <div className="text-[10px] font-black text-primary uppercase tracking-[2px] mb-1">Pure Promise</div>
                <div className="text-xs font-medium text-[#7A6848]">Gujarat Farm Direct Purity</div>
              </div>
              
              {user && (
                <button 
                  onClick={handleLogout}
                  className="w-full h-11 flex items-center justify-center gap-2 text-destructive font-bold text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setLoginOpen(false)} 
        initialSignUp={isSignUpMode}
      />
    </header>
  );
};
