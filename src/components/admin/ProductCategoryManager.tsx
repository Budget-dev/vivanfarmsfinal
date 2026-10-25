"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Sparkles, 
  Scale, 
  ImageIcon, 
  TicketPercent, 
  Coins, 
  Layers, 
  Star,
  CheckCircle2,
  AlertTriangle,
  Package,
  Milk,
  Droplets,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ProductVariant } from '@/types';

interface ProductCategoryManagerProps {
  category: string;
  title: string;
  description: string;
  icon?: string;
}

type VolumeUnit = 'ml' | 'L' | 'g' | 'kg' | 'pack' | 'custom';

export const ProductCategoryManager: React.FC<ProductCategoryManagerProps> = ({ 
  category, 
  title, 
  description,
}) => {
  const db = useFirestore();
  const { toast } = useToast();
  
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: allProducts, isLoading } = useCollection(productsRef);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDialogTab, setActiveDialogTab] = useState('general');
  
  // Default Unit depending on category
  const getDefaultUnit = (): VolumeUnit => {
    const cat = category.toLowerCase();
    if (cat === 'ghee') return 'ml';
    if (cat === 'honey') return 'g';
    if (cat === 'sweets') return 'g';
    return 'pack';
  };

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [desc, setDesc] = useState('');
  const [rating, setRating] = useState('4.9');
  const [reviews, setReviews] = useState('120');
  const [soldLabel, setSoldLabel] = useState('1.5k+');
  const [statusBadge, setStatusBadge] = useState('Selling Fast');
  const [topBadge, setTopBadge] = useState('Bestseller');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Volume & Variants State
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>(getDefaultUnit());
  const [customUnitName, setCustomUnitName] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([
    { s: '500 ml', p: 850, mrp: 999, on: true }
  ]);

  // Temporary inputs to add custom variant
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarMrp, setNewVarMrp] = useState('');

  // Loyalty & Promotion Fields
  const [productCoupon, setProductCoupon] = useState('');
  const [rewardCoins, setRewardCoins] = useState('50');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    const targetCat = category.toLowerCase();
    return allProducts.filter(p => {
      const matchesCat = (p.categoryId || '').toLowerCase() === targetCat;
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const stockQty = p.stockQuantity ?? p.stock ?? 10;
      
      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = stockQty > 5;
      if (stockFilter === 'low_stock') matchesStock = stockQty <= 5;

      return matchesCat && matchesSearch && matchesStock;
    });
  }, [allProducts, category, searchTerm, stockFilter]);

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error();
      }
      if (url.startsWith('data:')) {
        toast({ variant: "destructive", title: "Invalid URL", description: "Base64 data URLs are not allowed." });
        return;
      }
    } catch {
      toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid HTTP/HTTPS image URL." });
      return;
    }
    
    setUploadedImages(prev => [...prev, url]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName(''); setPrice(''); setMrpPrice(''); setStock('100'); setDesc(''); setUploadedImages([]);
    setNewImageUrl(''); setProductCoupon(''); setRewardCoins('50'); setEditingId(null); setRating('4.9'); setReviews('120');
    setSoldLabel('1.5k+'); setStatusBadge('Selling Fast'); setTopBadge('Bestseller');
    const defaultUnit = getDefaultUnit();
    setVolumeUnit(defaultUnit);
    setCustomUnitName('');
    const initSize = defaultUnit === 'ml' ? '500 ml' : defaultUnit === 'g' ? '500 g' : '1 Unit';
    setVariants([{ s: initSize, p: 0, mrp: 0, on: true }]);
    setNewVarSize(''); setNewVarPrice(''); setNewVarMrp('');
    setActiveDialogTab('general');
  };

  // Quick Preset Add
  const handleAddPreset = (sizeLabel: string) => {
    if (variants.some(v => v.s.toLowerCase() === sizeLabel.toLowerCase())) {
      toast({ title: "Variant exists", description: `Variant for ${sizeLabel} is already added.` });
      return;
    }
    const defaultP = Number(price) || (variants[0]?.p || 0);
    const defaultM = Number(mrpPrice) || (variants[0]?.mrp || 0);
    setVariants(prev => [...prev, { s: sizeLabel, p: defaultP, mrp: defaultM, on: prev.length === 0 }]);
  };

  // Add custom variant
  const handleAddCustomVariant = () => {
    if (!newVarSize.trim()) {
      toast({ variant: "destructive", title: "Missing Size", description: "Please enter a size or weight (e.g. 250ml or 1kg)." });
      return;
    }
    const sizeName = newVarSize.trim();
    if (variants.some(v => v.s.toLowerCase() === sizeName.toLowerCase())) {
      toast({ variant: "destructive", title: "Duplicate Size", description: "A variant with this size already exists." });
      return;
    }
    const vPrice = Number(newVarPrice) || Number(price) || 0;
    const vMrp = Number(newVarMrp) || Number(mrpPrice) || vPrice;
    
    setVariants(prev => [
      ...prev,
      { s: sizeName, p: vPrice, mrp: vMrp, on: prev.length === 0 }
    ]);

    setNewVarSize('');
    setNewVarPrice('');
    setNewVarMrp('');
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      toast({ variant: "destructive", title: "At least 1 variant required", description: "A product must have at least one size/variant." });
      return;
    }
    const wasDefault = variants[index].on;
    const updated = variants.filter((_, i) => i !== index);
    if (wasDefault && updated.length > 0) {
      updated[0].on = true;
      setPrice(String(updated[0].p));
      setMrpPrice(String(updated[0].mrp || updated[0].p));
    }
    setVariants(updated);
  };

  const handleSetDefaultVariant = (index: number) => {
    const updated = variants.map((v, i) => ({
      ...v,
      on: i === index
    }));
    setVariants(updated);
    setPrice(String(updated[index].p));
    setMrpPrice(String(updated[index].mrp || updated[index].p));
  };

  const handleVariantChange = (index: number, field: 'p' | 'mrp' | 's', val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
    if (updated[index].on) {
      if (field === 'p') setPrice(String(val));
      if (field === 'mrp') setMrpPrice(String(val));
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name || '');
    setPrice(String(p.basePrice || p.price || ''));
    setMrpPrice(String(p.mrpPrice || p.basePrice || p.price || ''));
    setStock(String(p.stockQuantity ?? p.stock ?? '100'));
    setDesc(p.description || '');
    setRating(String(p.rating || '4.9'));
    setReviews(String(p.reviewCount || '120'));
    setSoldLabel(p.soldCountLabel || '1.5k+');
    setStatusBadge(p.statusBadge || '');
    setTopBadge(p.badges?.[0] || '');
    setUploadedImages(p.imageUrls || []);
    setProductCoupon(p.productCoupon || '');
    setRewardCoins(String(p.rewardCoins || '50'));

    if (p.volumeUnit) {
      setVolumeUnit(p.volumeUnit as VolumeUnit);
    }
    if (Array.isArray(p.vars) && p.vars.length > 0) {
      setVariants(p.vars);
    } else {
      const defaultSize = p.vol || (p.volumeValue ? `${p.volumeValue}${p.volumeUnit || ''}` : 'Standard');
      setVariants([{ s: defaultSize, p: Number(p.basePrice) || 0, mrp: Number(p.mrpPrice) || Number(p.basePrice) || 0, on: true }]);
    }

    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Product name is required." });
      return;
    }

    let finalImageUrls = [...uploadedImages];
    if (newImageUrl.trim()) {
      try {
        const parsed = new URL(newImageUrl.trim());
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !newImageUrl.trim().startsWith('data:')) {
          finalImageUrls.push(newImageUrl.trim());
        }
      } catch (e) {
        // Ignored
      }
    }

    if (finalImageUrls.length === 0) {
      toast({ variant: "destructive", title: "Image Required", description: "Please add at least one product image URL." });
      return;
    }

    let finalVars = variants;
    if (!finalVars || finalVars.length === 0) {
      finalVars = [{ s: 'Standard', p: Number(price) || 0, mrp: Number(mrpPrice) || Number(price) || 0, on: true }];
    }

    finalVars = finalVars.map((variant, index) => ({
      ...variant,
      s: String(variant.s).trim(),
      p: Number(variant.p) || 0,
      mrp: Number(variant.mrp) || Number(variant.p) || 0,
      on: Boolean(variant.on) || (!finalVars.some(v => v.on) && index === 0),
    }));

    const defaultVar = finalVars.find(v => v.on) || finalVars[0];
    const finalBasePrice = Number(defaultVar.p) || Number(price) || 0;
    const finalMrpPrice = Number(defaultVar.mrp) || Number(mrpPrice) || finalBasePrice;

    if (finalBasePrice <= 0) {
      toast({ variant: "destructive", title: "Invalid Price", description: "Please set a selling price greater than ₹0." });
      return;
    }

    const catId = category.toLowerCase();
    
    const productData = {
      name: name.trim(),
      basePrice: finalBasePrice,
      mrpPrice: finalMrpPrice,
      price: finalBasePrice,
      stockQuantity: Number(stock) || 100,
      stock: Number(stock) || 100,
      description: desc.trim() || name.trim(),
      rating: Number(rating) || 4.9,
      reviewCount: Number(reviews) || 0,
      soldCountLabel: soldLabel.trim() || "New",
      statusBadge: statusBadge.trim() || "",
      badges: topBadge ? [topBadge.trim()] : [],
      categoryId: catId,
      cat: catId,
      imageUrls: finalImageUrls,
      isLive: true, 
      updatedAt: new Date().toISOString(),
      volumeUnit: volumeUnit === 'custom' ? (customUnitName || 'custom') : volumeUnit,
      volumeValue: defaultVar.s,
      vol: defaultVar.s,
      vars: finalVars,
      productCoupon: productCoupon.toUpperCase().trim(),
      rewardCoins: Number(rewardCoins) || 0
    };

    setIsSaving(true);
    
    try {
      if (editingId) {
        await setDoc(doc(db, 'products', editingId), productData, { merge: true });
        toast({ title: "Product Updated", description: `${name} has been updated successfully.` });
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
        toast({ title: "Product Published", description: `${name} is now live on the storefront.` });
      }
      
      setIsAddOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Database Error", 
        description: error.message || "Failed to save product."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (confirm(`Are you sure you want to delete "${prodName}" from the catalog?`)) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast({ title: "Product Removed", description: `${prodName} deleted from inventory.` });
      } catch (error: any) {
        toast({ 
          variant: "destructive", 
          title: "Delete Failed", 
          description: error.message || "Failed to delete product."
        });
      }
    }
  };

  const presetOptions: Record<VolumeUnit, string[]> = {
    ml: ['250 ml', '500 ml', '1000 ml (1 L)', '2000 ml (2 L)', '5000 ml (5 L)'],
    L: ['0.5 L', '1 L', '2 L', '5 L'],
    g: ['250 g', '500 g', '1 kg (1000g)', '2 kg', '5 kg'],
    kg: ['0.5 kg', '1 kg', '2 kg', '5 kg'],
    pack: ['1 Unit', 'Pack of 2', 'Pack of 3', 'Gift Pack'],
    custom: ['Small', 'Medium', 'Large', 'Tasting Box']
  };

  const getCategoryIcon = () => {
    const c = category.toLowerCase();
    if (c === 'ghee') return <Milk className="w-5 h-5 text-emerald-600" />;
    if (c === 'sweets') return <Sparkles className="w-5 h-5 text-pink-600" />;
    if (c === 'honey') return <Droplets className="w-5 h-5 text-yellow-600" />;
    return <Flame className="w-5 h-5 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing {title} catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
              <Badge variant="outline" className="text-xs font-mono">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs font-medium">
            <Link href="/" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
          </Button>
          <Button 
            size="sm" 
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add {category}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/80 shadow-sm">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${category.toLowerCase()} products...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
              <button
                onClick={() => setStockFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors",
                  stockFilter === 'all' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors",
                  stockFilter === 'in_stock' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                In Stock
              </button>
              <button
                onClick={() => setStockFilter('low_stock')}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors",
                  stockFilter === 'low_stock' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Low Stock
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="w-16 px-4">Item</TableHead>
              <TableHead className="px-4">Product Details</TableHead>
              <TableHead className="px-4">Pricing & MRP</TableHead>
              <TableHead className="px-4">Variants</TableHead>
              <TableHead className="px-4">Stock Status</TableHead>
              <TableHead className="px-4">Rating</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const stockQty = p.stockQuantity ?? p.stock ?? 10;
                const isLow = stockQty <= 5;
                const hasDiscount = p.mrpPrice && p.mrpPrice > (p.basePrice || p.price);
                const discountPct = hasDiscount 
                  ? Math.round(((p.mrpPrice - (p.basePrice || p.price)) / p.mrpPrice) * 100)
                  : 0;
                const defaultVar = p.vars?.find((v: any) => v.on) || p.vars?.[0];

                return (
                  <TableRow key={p.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="relative w-12 h-12 rounded-lg border border-border/80 overflow-hidden bg-muted/40 shrink-0">
                        {p.imageUrls?.[0] ? (
                          <Image
                            src={p.imageUrls[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{p.name}</span>
                          {p.badges?.[0] && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                              {p.badges[0]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{defaultVar?.s || p.vol || 'Standard'}</span>
                          {p.productCoupon && (
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                              {p.productCoupon}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground">
                            ₹{(p.basePrice || p.price || 0).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{p.mrpPrice}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {p.vars?.length || 1} {(p.vars?.length || 1) === 1 ? 'Size' : 'Sizes'}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {isLow ? (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1 text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {stockQty} Units Left
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {stockQty} in Stock
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-medium text-foreground">{p.rating || 4.9}</span>
                        <span className="text-muted-foreground text-[11px]">({p.reviewCount || 0})</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(p)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View on Store"
                        >
                          <Link href={`/product/${p.id}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No {category.toLowerCase()} products found matching your filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Product Shadcn Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure product catalog information, size variants, media gallery, and store pricing.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="pt-2">
            <TabsList className="grid grid-cols-4 h-9">
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="variants" className="text-xs">Sizes & Variants</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs">Pricing & Rewards</TabsTrigger>
              <TabsTrigger value="media" className="text-xs">Media Gallery</TabsTrigger>
            </TabsList>

            {/* TAB 1: GENERAL INFO */}
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Product Title</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. A2 Gir Cow Vedic Bilona Ghee"
                  className="h-9 text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <Input value={category} disabled className="h-9 text-xs bg-muted/50 capitalize" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Top Badge / Pill</label>
                  <Input 
                    value={topBadge} 
                    onChange={(e) => setTopBadge(e.target.value)} 
                    placeholder="e.g. Bestseller, Pure Vedic"
                    className="h-9 text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Status Badge</label>
                  <Input 
                    value={statusBadge} 
                    onChange={(e) => setStatusBadge(e.target.value)} 
                    placeholder="e.g. Selling Fast"
                    className="h-9 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Rating Score</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={rating} 
                    onChange={(e) => setRating(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Review Count</label>
                  <Input 
                    type="number" 
                    value={reviews} 
                    onChange={(e) => setReviews(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Product Description</label>
                <Textarea 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  rows={4}
                  placeholder="Traditional curd churned bilona method A2 ghee made from grass-fed Gir cows..."
                  className="text-xs" 
                />
              </div>
            </TabsContent>

            {/* TAB 2: SIZES & VARIANTS */}
            <TabsContent value="variants" className="space-y-4 pt-4">
              {/* Unit Type Selection */}
              <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  Select Unit Measurement
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ml', label: 'Millilitres (ml)' },
                    { id: 'L', label: 'Litres (L)' },
                    { id: 'g', label: 'Grams (g)' },
                    { id: 'kg', label: 'Kilograms (kg)' },
                    { id: 'pack', label: 'Packs' },
                  ].map((u) => (
                    <Button
                      key={u.id}
                      type="button"
                      variant={volumeUnit === u.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVolumeUnit(u.id as VolumeUnit)}
                      className={cn(
                        "h-7 text-xs px-2.5",
                        volumeUnit === u.id ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                      )}
                    >
                      {u.label}
                    </Button>
                  ))}
                </div>

                {/* Presets */}
                <div className="pt-2">
                  <span className="text-[11px] text-muted-foreground mr-2">Quick Presets:</span>
                  <div className="inline-flex flex-wrap gap-1 mt-1">
                    {presetOptions[volumeUnit]?.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddPreset(preset)}
                        className="text-[11px] bg-background border border-border/80 px-2 py-0.5 rounded hover:bg-muted text-foreground transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Custom Variant Row */}
              <div className="p-3 rounded-lg border border-border space-y-2">
                <span className="text-xs font-semibold text-foreground">Add Custom Variant</span>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Size (e.g. 750 ml)"
                    value={newVarSize}
                    onChange={(e) => setNewVarSize(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Selling Price (₹)"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="MRP (₹)"
                    value={newVarMrp}
                    onChange={(e) => setNewVarMrp(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleAddCustomVariant}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Add Size
                  </Button>
                </div>
              </div>

              {/* Variants Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="text-xs h-9">Size / Weight</TableHead>
                      <TableHead className="text-xs h-9">Selling Price (₹)</TableHead>
                      <TableHead className="text-xs h-9">MRP (₹)</TableHead>
                      <TableHead className="text-xs h-9 text-center">Default</TableHead>
                      <TableHead className="text-xs h-9 text-right">Remove</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v, idx) => (
                      <TableRow key={idx} className="border-b border-border/40">
                        <TableCell className="py-2">
                          <Input
                            value={v.s}
                            onChange={(e) => handleVariantChange(idx, 's', e.target.value)}
                            className="h-7 text-xs font-medium w-28"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            value={v.p}
                            onChange={(e) => handleVariantChange(idx, 'p', Number(e.target.value))}
                            className="h-7 text-xs w-24"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            value={v.mrp || v.p}
                            onChange={(e) => handleVariantChange(idx, 'mrp', Number(e.target.value))}
                            className="h-7 text-xs w-24"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Button
                            type="button"
                            variant={v.on ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSetDefaultVariant(idx)}
                            className={cn(
                              "h-6 text-[10px] px-2",
                              v.on ? "bg-emerald-600 text-white" : ""
                            )}
                          >
                            {v.on ? "Default" : "Make Default"}
                          </Button>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveVariant(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TAB 3: PRICING & REWARDS */}
            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Inventory Units</label>
                  <Input 
                    type="number" 
                    value={stock} 
                    onChange={(e) => setStock(e.target.value)} 
                    placeholder="100"
                    className="h-9 text-xs" 
                  />
                  <p className="text-[11px] text-muted-foreground">Available stock across all variants</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Reward Purity Coins</label>
                  <Input 
                    type="number" 
                    value={rewardCoins} 
                    onChange={(e) => setRewardCoins(e.target.value)} 
                    placeholder="50"
                    className="h-9 text-xs" 
                  />
                  <p className="text-[11px] text-muted-foreground">Coins awarded to customer on order</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Product Coupon</label>
                  <Input 
                    value={productCoupon} 
                    onChange={(e) => setProductCoupon(e.target.value)} 
                    placeholder="e.g. BILONA10"
                    className="h-9 text-xs font-mono" 
                  />
                  <p className="text-[11px] text-muted-foreground">Auto-applied discount voucher</p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: MEDIA GALLERY */}
            <TabsContent value="media" className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Paste direct HTTPS image URL..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAddImageUrl}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Image
                </Button>
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                {uploadedImages.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg border border-border overflow-hidden aspect-square bg-muted/40">
                    <Image
                      src={url}
                      alt={`Product image ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-emerald-700 text-white px-1 rounded font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
                {uploadedImages.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    No images added yet. Paste a valid image link above.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? "Saving..." : editingId ? "Update Product" : "Publish Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
