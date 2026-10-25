"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  ExternalLink, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  User, 
  Bell,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebarContent } from './AdminSidebar';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export const AdminHeader: React.FC = () => {
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

  // Generate breadcrumb items from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const label = part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { href, label };
  });

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 md:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Sheet Trigger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-zinc-950 text-zinc-100 border-zinc-800">
              <AdminSidebarContent isMobile />
            </SheetContent>
          </Sheet>
        </div>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link 
            href="/admin" 
            className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Admin Console</span>
          </Link>
          {breadcrumbs.slice(1).map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <Link
                href={crumb.href}
                className={
                  idx === breadcrumbs.length - 2
                    ? "font-semibold text-foreground truncate max-w-[160px] sm:max-w-xs"
                    : "hover:text-foreground transition-colors truncate max-w-[100px]"
                }
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Storefront Link */}
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="h-8 gap-1.5 text-xs font-medium border-border/80 hover:bg-accent"
        >
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Live Storefront</span>
          </Link>
        </Button>

        {/* Operational System Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Systems Live</span>
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-offset-background hover:ring-2 hover:ring-emerald-500/30">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-emerald-700 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">Super Administrator</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Dashboard Overview</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/orders" className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                <span>Manage Orders</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank" className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View Storefront</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
