"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Toaster } from '@/components/ui/toaster';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const ADMIN_EMAIL = 'vivanfarmsnatural@gmail.com';
  const adminRoleRef = useMemoFirebase(() => user ? doc(db, 'adminRoles', user.uid) : null, [db, user]);
  const { data: adminRoleDoc, isLoading: isRoleLoading } = useDoc(adminRoleRef);

  const isAuthorized = user && (
    (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    adminRoleDoc?.role === 'admin'
  );

  useEffect(() => {
    if (!isUserLoading && !isRoleLoading && !isAuthorized && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, isAuthorized, isRoleLoading, router, pathname]);

  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-foreground">
        {children}
        <Toaster />
      </div>
    );
  }

  if (isUserLoading || (user && !isAuthorized && isRoleLoading)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Admin Workspace...</p>
      </div>
    );
  }

  // Final gate check for authorized email or role
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/70 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
