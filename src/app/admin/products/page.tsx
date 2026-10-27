"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Milk, 
  Sparkles, 
  Droplets, 
  Flame, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Plus,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function AdminProductsPage() {
  const db = useFirestore();
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: allProducts, isLoading } = useCollection(productsRef);

  const sections = [
    { 
      id: 'ghee', 
      label: 'A2 Vedic Ghee', 
      desc: 'Traditional Bilona churned pure Gir cow ghee', 
      icon: Milk, 
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      href: '/admin/products/ghee',
      catId: 'ghee'
    },
    { 
      id: 'sweets', 
      label: 'Artisanal Sweets', 
      desc: 'Farm-fresh sweets made with pure A2 ghee', 
      icon: Sparkles, 
      color: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
      href: '/admin/products/sweets',
      catId: 'sweets'
    },
    { 
      id: 'honey', 
      label: 'Wild Raw Honey', 
      desc: 'Unfiltered, unpasteurized natural forest honey', 
      icon: Droplets, 
      color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
      href: '/admin/products/honey',
      catId: 'honey'
    },
    { 
      id: 'pickles', 
      label: 'Traditional Pickles', 
      desc: 'Sun-dried traditional heritage pickles & condiments', 
      icon: Flame, 
      color: 'text-red-600 bg-red-500/10 border-red-500/20',
      href: '/admin/products/pickles',
      catId: 'pickles'
    },
  ];

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; lowStock: number }> = {
      ghee: { count: 0, lowStock: 0 },
      sweets: { count: 0, lowStock: 0 },
      honey: { count: 0, lowStock: 0 },
      pickles: { count: 0, lowStock: 0 }
    };
    if (!allProducts) return stats;

    allProducts.forEach(p => {
      const cat = (p.categoryId || p.cat || '').toLowerCase();
      if (stats[cat]) {
        stats[cat].count++;
        const stockQty = p.stockQuantity ?? p.stock ?? 10;
        if (stockQty <= 5) stats[cat].lowStock++;
      }
    });
    return stats;
  }, [allProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Catalog & Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a product category to manage variants, stock levels, and store pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/admin/products/ghee">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const stat = categoryStats[section.catId] || { count: 0, lowStock: 0 };
          return (
            <Link key={section.id} href={section.href}>
              <Card className="h-full border border-border/80 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all group cursor-pointer bg-card">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${section.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {section.label}
                        </h3>
                        <Badge variant="outline" className="text-[11px] font-mono">
                          {stat.count} {stat.count === 1 ? 'Product' : 'Products'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {section.desc}
                      </p>
                      {stat.lowStock > 0 && (
                        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{stat.lowStock} SKU(s) low on inventory</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/30 group-hover:translate-x-1 transition-all shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Catalog Health Summary Box */}
      <Card className="border border-border/80 shadow-sm bg-muted/30">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Catalog Integrity & Batch Traceability</h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                All products and variants synchronize in real-time with the customer storefront, ensuring inventory counts match physical stock batches.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium">
              <Link href="/admin/categories">Manage Category Tags</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
