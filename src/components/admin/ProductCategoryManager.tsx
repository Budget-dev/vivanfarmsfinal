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
  ArrowUpDown,
  Video,
  Play,
  Pause,
  Eye,
  Film,
  Instagram,
  Heart,
  MessageCircle,
  Share2,
  Copy,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { collection, doc, addDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductVariant, ProductReel } from '@/types';

interface ProductCategoryManagerProps {
  category?: string;
  title?: string;
  description?: string;
  icon?: string;
}

type VolumeUnit = 'ml' | 'L' | 'g' | 'kg' | 'pack' | 'custom';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Catalog', icon: Package },
  { id: 'ghee', label: 'A2 Vedic Ghee', icon: Milk },
  { id: 'sweets', label: 'Farm Sweets', icon: Sparkles },
  { id: 'honey', label: 'Raw Honey', icon: Droplets },
  { id: 'oils', label: 'Wood Pressed Oils', icon: Droplets },
  { id: 'pickles', label: 'Pickles', icon: Flame },
  { id: 'combos', label: 'Combos & Packs', icon: Layers },
];

const PRESET_SAMPLE_VIDEOS = [
  {
    label: "Sacred Bilona Churning (1:1 / 9:16)",
    url: "https://vivanfa.sirv.com/Firefly%20Create%20a%20cinematic%205-second%20square%20(1-1)%20premium%20food%20advertisement%20set%20in%20a%20warm%2C%20rustic%20ki.mp4",
  },
  {
    label: "Farm Fresh Pouring",
    url: "https://vivanfa.sirv.com/Firefly%20Create%20a%20cinematic%205-second%20square%20(1-1)%20premium%20food%20advertisement%20set%20in%20a%20warm%2C%20rustic%20ki.mp4",
  }
];

const PRESET_IMAGES = [
  { label: 'Ghee Heritage Tin', url: '/images/products/ghee_tin.jpg' },
  { label: 'Ghee Glass Jar', url: '/images/products/ghee_jar.jpg' },
  { label: 'Artisanal Sweets', url: '/images/products/sweets.jpg' },
  { label: 'Raw Forest Honey', url: '/images/products/honey_jar.jpg' },
  { label: 'Cold Pressed Mustard Oil', url: '/images/products/mustard_oil.jpg' },
];

export const ProductCategoryManager: React.FC<ProductCategoryManagerProps> = ({ 
  category = 'all', 
  title = 'Product Inventory & Catalog', 
  description = 'High-density management, 9:16 reels, and bulk operations across all categories.',
}) => {
  const db = useFirestore();
  const { toast } = useToast();
  
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: allProducts, isLoading } = useCollection(productsRef);
  
  // Filtering & View State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(category.toLowerCase());
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'live' | 'draft'>('all');
  
  // Bulk selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDialogTab, setActiveDialogTab] = useState('general');

  // Form Fields
  const [name, setName] = useState('');
  const [productCat, setProductCat] = useState('ghee');
  const [price, setPrice] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [desc, setDesc] = useState('');
  const [rating, setRating] = useState('4.9');
  const [reviews, setReviews] = useState('120');
  const [soldLabel, setSoldLabel] = useState('1.5k+ delivered');
  const [statusBadge, setStatusBadge] = useState('Selling Fast');
  const [topBadge, setTopBadge] = useState('Bestseller');
  const [isLiveProduct, setIsLiveProduct] = useState(true);
  
  // Images
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Volume & Variants
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('ml');
  const [customUnitName, setCustomUnitName] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([
    { s: '500 ml', p: 850, mrp: 999, on: true }
  ]);
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarMrp, setNewVarMrp] = useState('');

  // 9:16 Video Reels
  const [reels, setReels] = useState<ProductReel[]>([]);
  const [reelTitleSuffix, setReelTitleSuffix] = useState('Vedic Process');
  const [reelSubtitle, setReelSubtitle] = useState('Gujarat Organic Farm');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelPosterUrl, setReelPosterUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [reelTag, setReelTag] = useState('100% Pure');
  const [activePreviewReelIndex, setActivePreviewReelIndex] = useState(0);

  // Story, Ingredients & Care
  const [ingredientsText, setIngredientsText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [howMadeText, setHowMadeText] = useState('');
  const [cookingCareText, setCookingCareText] = useState('');

  // Loyalty & Promotion
  const [productCoupon, setProductCoupon] = useState('');
  const [rewardCoins, setRewardCoins] = useState('50');

  // Filtered Products computation
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    
    return allProducts.filter(p => {
      const pCat = (p.categoryId || p.cat || '').toLowerCase();
      
      // Category tab filter
      if (selectedCategoryTab !== 'all') {
        const target = selectedCategoryTab.toLowerCase();
        const matchesCategory = pCat === target || 
          (target === 'ghee' && pCat.includes('ghee')) || 
          (target === 'sweets' && (pCat.includes('sweet') || pCat.includes('ladoo') || pCat.includes('peda'))) || 
          (target === 'honey' && pCat.includes('honey')) ||
          (target === 'oils' && pCat.includes('oil')) ||
          (target === 'pickles' && pCat.includes('pickle')) ||
          (target === 'combos' && (pCat.includes('combo') || pCat.includes('pack')));
        
        if (!matchesCategory) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = pCat.includes(q);
        const badgeMatch = Array.isArray(p.badges) && p.badges.some((b: string) => b.toLowerCase().includes(q));
        if (!nameMatch && !descMatch && !catMatch && !badgeMatch) return false;
      }

      // Stock filter
      const stockQty = p.stockQuantity ?? p.stock ?? 10;
      if (stockFilter === 'in_stock' && stockQty <= 5) return false;
      if (stockFilter === 'low_stock' && (stockQty > 5 || stockQty === 0)) return false;
      if (stockFilter === 'out_of_stock' && stockQty > 0) return false;

      // Visibility filter
      const isLive = p.isLive !== false;
      if (visibilityFilter === 'live' && !isLive) return false;
      if (visibilityFilter === 'draft' && isLive) return false;

      return true;
    });
  }, [allProducts, selectedCategoryTab, searchTerm, stockFilter, visibilityFilter]);

  // Overall catalog stats
  const catalogStats = useMemo(() => {
    if (!allProducts) return { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    allProducts.forEach(p => {
      const q = p.stockQuantity ?? p.stock ?? 10;
      if (q === 0) outOfStock++;
      else if (q <= 5) lowStock++;
      else inStock++;
    });

    return { total: allProducts.length, inStock, lowStock, outOfStock };
  }, [allProducts]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkUpdateStock = async (newStock: number) => {
    if (selectedProductIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        selectedProductIds.map(id => 
          updateDoc(doc(db, 'products', id), {
            stockQuantity: newStock,
            stock: newStock,
            updatedAt: new Date().toISOString()
          })
        )
      );
      toast({ title: "Bulk Stock Updated", description: `Updated ${selectedProductIds.length} products to ${newStock} units.` });
      setSelectedProductIds([]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Bulk Update Failed", description: e.message });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateVisibility = async (makeLive: boolean) => {
    if (selectedProductIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        selectedProductIds.map(id => 
          updateDoc(doc(db, 'products', id), {
            isLive: makeLive,
            status: makeLive ? 'published' : 'draft',
            updatedAt: new Date().toISOString()
          })
        )
      );
      toast({ title: "Visibility Updated", description: `${selectedProductIds.length} products are now ${makeLive ? 'Live on Store' : 'Draft / Hidden'}.` });
      setSelectedProductIds([]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Bulk Update Failed", description: e.message });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkMoveCategory = async (newCat: string) => {
    if (selectedProductIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        selectedProductIds.map(id => 
          updateDoc(doc(db, 'products', id), {
            categoryId: newCat.toLowerCase(),
            cat: newCat.toLowerCase(),
            updatedAt: new Date().toISOString()
          })
        )
      );
      toast({ title: "Category Updated", description: `Moved ${selectedProductIds.length} products to ${newCat}.` });
      setSelectedProductIds([]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Bulk Update Failed", description: e.message });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedProductIds.length} selected products?`)) return;
    
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        selectedProductIds.map(id => deleteDoc(doc(db, 'products', id)))
      );
      toast({ title: "Products Deleted", description: `Permanently removed ${selectedProductIds.length} products.` });
      setSelectedProductIds([]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Inline toggle single product live
  const handleToggleProductLive = async (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentLive = p.isLive !== false;
    try {
      await updateDoc(doc(db, 'products', p.id), {
        isLive: !currentLive,
        status: !currentLive ? 'published' : 'draft',
        updatedAt: new Date().toISOString()
      });
      toast({ title: !currentLive ? "Product Live" : "Product Hidden", description: `${p.name} is now ${!currentLive ? 'visible' : 'hidden'} on storefront.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    }
  };

  // Image actions
  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
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

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setUploadedImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
      return arr;
    });
    toast({ title: "Primary Image Updated", description: "Selected image is now the main product cover." });
  };

  // 9:16 Reel actions
  const handleAddReel = () => {
    const video = reelVideoUrl.trim();
    if (!video) {
      toast({ variant: "destructive", title: "Video URL Required", description: "Please enter an MP4 or video link for the 9:16 reel." });
      return;
    }

    const prodTitle = name.trim() || 'Product';
    const computedTitle = reelTitleSuffix.trim() 
      ? `${prodTitle} — ${reelTitleSuffix.trim()}`
      : prodTitle;

    const newReel: ProductReel = {
      id: `reel-${Date.now()}`,
      title: computedTitle,
      subtitle: reelSubtitle.trim() || 'Gujarat Organic Farm',
      videoUrl: video,
      posterUrl: reelPosterUrl.trim() || uploadedImages[0] || '/images/products/ghee_tin.jpg',
      caption: reelCaption.trim() || `Experience authentic Vedic ${prodTitle}. Handcrafted with pure farm-fresh ingredients! 🔥🌿`,
      tag: reelTag.trim() || prodTitle,
      viewsLabel: '24.8k',
      likesCount: 3840,
      commentsCount: 142,
      sharesCount: 420
    };

    setReels(prev => [...prev, newReel]);
    setReelVideoUrl('');
    setReelPosterUrl('');
    setReelCaption('');
    toast({ title: "9:16 Reel Added", description: `Reel "${computedTitle}" tied to ${prodTitle}.` });
  };

  const handleRemoveReel = (id: string) => {
    setReels(prev => prev.filter(r => r.id !== id));
  };

  // Reset Form
  const resetForm = () => {
    setName('');
    setProductCat(selectedCategoryTab !== 'all' ? selectedCategoryTab : 'ghee');
    setPrice('');
    setMrpPrice('');
    setStock('100');
    setDesc('');
    setUploadedImages([]);
    setNewImageUrl('');
    setProductCoupon('');
    setRewardCoins('50');
    setEditingId(null);
    setRating('4.9');
    setReviews('120');
    setSoldLabel('1.5k+ delivered');
    setStatusBadge('Selling Fast');
    setTopBadge('Bestseller');
    setIsLiveProduct(true);
    setVolumeUnit('ml');
    setCustomUnitName('');
    setVariants([{ s: '500 ml', p: 0, mrp: 0, on: true }]);
    setNewVarSize('');
    setNewVarPrice('');
    setNewVarMrp('');
    setReels([]);
    setReelTitleSuffix('Vedic Process');
    setReelSubtitle('Gujarat Organic Farm');
    setReelVideoUrl('');
    setReelPosterUrl('');
    setReelCaption('');
    setReelTag('100% Pure');
    setIngredientsText('');
    setBenefitsText('');
    setHowMadeText('');
    setCookingCareText('');
    setActiveDialogTab('general');
  };

  // Populate Form for Editing
  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name || p.title || '');
    setProductCat(p.categoryId || p.cat || 'ghee');
    setPrice(String(p.basePrice || p.price || ''));
    setMrpPrice(String(p.mrpPrice || p.basePrice || p.price || ''));
    setStock(String(p.stockQuantity ?? p.stock ?? '100'));
    setDesc(p.description || '');
    setRating(String(p.rating || '4.9'));
    setReviews(String(p.reviewCount || '120'));
    setSoldLabel(p.soldCountLabel || '1.5k+ delivered');
    setStatusBadge(p.statusBadge || '');
    setTopBadge(p.badges?.[0] || '');
    setIsLiveProduct(p.isLive !== false);
    setUploadedImages(p.imageUrls || []);
    setProductCoupon(p.productCoupon || '');
    setRewardCoins(String(p.rewardCoins || '50'));

    if (p.volumeUnit) setVolumeUnit(p.volumeUnit as VolumeUnit);
    
    if (Array.isArray(p.vars) && p.vars.length > 0) {
      setVariants(p.vars);
    } else {
      const defaultSize = p.vol || (p.volumeValue ? `${p.volumeValue}${p.volumeUnit || ''}` : 'Standard');
      setVariants([{ s: defaultSize, p: Number(p.basePrice) || 0, mrp: Number(p.mrpPrice) || Number(p.basePrice) || 0, on: true }]);
    }

    // Reels
    if (Array.isArray(p.reels) && p.reels.length > 0) {
      setReels(p.reels);
    } else if (p.videoUrl) {
      setReels([{
        id: 'reel-main',
        title: `${p.name || 'Product'} — Official Reel`,
        subtitle: 'Farm Direct Craftsmanship',
        videoUrl: p.videoUrl,
        posterUrl: p.imageUrls?.[0] || '/images/products/ghee_tin.jpg',
        caption: `Watch authentic ${p.name} handcrafted at our farm! ✨🌾`,
        viewsLabel: '28.4k',
        likesCount: 4890,
        commentsCount: 184,
        sharesCount: 520,
        tag: p.name || 'A2 Desi Farm'
      }]);
    } else {
      setReels([]);
    }

    // Story fields
    if (Array.isArray(p.ingredients)) setIngredientsText(p.ingredients.join('\n'));
    else if (p.ingredients) setIngredientsText(String(p.ingredients));
    else setIngredientsText('');

    if (Array.isArray(p.benefits)) setBenefitsText(p.benefits.join('\n'));
    else if (p.benefits) setBenefitsText(String(p.benefits));
    else setBenefitsText('');

    setHowMadeText(p.howMade || '');
    setCookingCareText(p.cookingCare || '');

    setIsAddOpen(true);
  };

  // Save product
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Product Title Required", description: "Please enter a product title." });
      return;
    }

    let finalImages = [...uploadedImages];
    if (newImageUrl.trim()) {
      try {
        const u = new URL(newImageUrl.trim());
        if (u.protocol === 'http:' || u.protocol === 'https:') finalImages.push(newImageUrl.trim());
      } catch {}
    }

    if (finalImages.length === 0) {
      // Provide default fallback image for this category
      if (productCat === 'ghee') finalImages.push('/images/products/ghee_tin.jpg');
      else if (productCat === 'sweets') finalImages.push('/images/products/sweets.jpg');
      else if (productCat === 'honey') finalImages.push('/images/products/honey_jar.jpg');
      else finalImages.push('/images/products/mustard_oil.jpg');
    }

    let finalVars = variants;
    if (!finalVars || finalVars.length === 0) {
      finalVars = [{ s: 'Standard', p: Number(price) || 0, mrp: Number(mrpPrice) || Number(price) || 0, on: true }];
    }

    const defaultVar = finalVars.find(v => v.on) || finalVars[0];
    const finalBasePrice = Number(defaultVar.p) || Number(price) || 0;
    const finalMrpPrice = Number(defaultVar.mrp) || Number(mrpPrice) || finalBasePrice;

    if (finalBasePrice <= 0) {
      toast({ variant: "destructive", title: "Invalid Price", description: "Please enter a selling price greater than ₹0." });
      return;
    }

    // Process ingredients & benefits from multi-line text
    const ingredientsList = ingredientsText
      .split('\n')
      .map(s => s.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean);

    const benefitsList = benefitsText
      .split('\n')
      .map(s => s.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean);

    // Format reels ensuring title matches product
    const formattedReels = reels.map((r, idx) => {
      const baseTitle = r.title || 'In Action';
      const reelTitle = baseTitle.toLowerCase().includes(name.trim().toLowerCase())
        ? baseTitle
        : `${name.trim()} — ${baseTitle}`;

      return {
        ...r,
        id: r.id || `reel-${idx}`,
        title: reelTitle,
        posterUrl: r.posterUrl || finalImages[0] || '/images/products/ghee_tin.jpg',
        tag: r.tag || name.trim()
      };
    });

    const catNormalized = productCat.toLowerCase().trim();

    const productPayload = {
      name: name.trim(),
      title: name.trim(),
      basePrice: finalBasePrice,
      mrpPrice: finalMrpPrice,
      price: finalBasePrice,
      stockQuantity: Number(stock) || 100,
      stock: Number(stock) || 100,
      description: desc.trim() || name.trim(),
      rating: Number(rating) || 4.9,
      reviewCount: Number(reviews) || 0,
      soldCountLabel: soldLabel.trim() || "1.5k+ delivered",
      statusBadge: statusBadge.trim() || "",
      badges: topBadge ? [topBadge.trim()] : [],
      categoryId: catNormalized,
      cat: catNormalized,
      imageUrls: finalImages,
      isLive: isLiveProduct,
      status: isLiveProduct ? 'published' : 'draft',
      volumeUnit: volumeUnit === 'custom' ? (customUnitName || 'custom') : volumeUnit,
      volumeValue: defaultVar.s,
      vol: defaultVar.s,
      vars: finalVars,
      reels: formattedReels,
      videoUrl: formattedReels[0]?.videoUrl || (reels[0]?.videoUrl || ''),
      ingredients: ingredientsList,
      benefits: benefitsList,
      howMade: howMadeText.trim(),
      cookingCare: cookingCareText.trim(),
      productCoupon: productCoupon.toUpperCase().trim(),
      rewardCoins: Number(rewardCoins) || 50,
      purityCoins: Number(rewardCoins) || Math.round(finalBasePrice * 0.1),
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'products', editingId), productPayload, { merge: true });
        toast({ title: "Product Updated", description: `${name} saved successfully with ${formattedReels.length} reels.` });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Product Created", description: `${name} is now in your catalog.` });
      }
      setIsAddOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (id: string, prodName: string) => {
    if (confirm(`Permanently delete "${prodName}"?`)) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast({ title: "Product Deleted", description: `${prodName} removed from database.` });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: e.message });
      }
    }
  };

  // Duplicate product
  const handleDuplicate = async (p: any) => {
    try {
      const duplicateData = {
        ...p,
        name: `${p.name} (Copy)`,
        title: `${p.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      delete duplicateData.id;
      await addDoc(collection(db, 'products'), duplicateData);
      toast({ title: "Product Duplicated", description: `Created copy of ${p.name}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Duplicate Failed", description: e.message });
    }
  };

  const presetOptions: Record<VolumeUnit, string[]> = {
    ml: ['250 ml', '500 ml', '1000 ml (1 L)', '2000 ml (2 L)', '5000 ml (5 L)', '15 L Tin'],
    L: ['0.5 L', '1 L', '2 L', '5 L', '15 L'],
    g: ['250 g', '500 g', '1 kg (1000g)', '2 kg', '5 kg'],
    kg: ['0.5 kg', '1 kg', '2 kg', '5 kg'],
    pack: ['1 Unit', 'Pack of 2', 'Pack of 3', 'Gift Pack', 'Kitchen Trio'],
    custom: ['Small', 'Medium', 'Large', 'Celebration Hamper']
  };

  if (isLoading) {
    return (
      <div className="h-[450px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse uppercase tracking-wider">Syncing Live Catalog...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 font-sans max-w-full">
      
      {/* ── 1. COMPACT TOP HEADER & STATS BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 rounded-xl p-3 sm:p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <Badge variant="outline" className="text-xs font-mono bg-muted/30">
              {filteredProducts.length} shown of {catalogStats.total} total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Metrics Badges */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono mr-2 bg-muted/40 p-1 rounded-lg border border-border/60">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium">
              {catalogStats.inStock} In Stock
            </span>
            {catalogStats.lowStock > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium">
                {catalogStats.lowStock} Low Stock
              </span>
            )}
            {catalogStats.outOfStock > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-medium">
                {catalogStats.outOfStock} Out of Stock
              </span>
            )}
          </div>

          <Button variant="outline" size="sm" asChild className="h-8 gap-1 text-xs">
            <Link href="/" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
          </Button>

          <Button 
            size="sm" 
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="h-8 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* ── 2. CATEGORY PILLS TABS ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategoryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategoryTab(tab.id);
                setSelectedProductIds([]);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer",
                isActive 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                  : "bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. SEARCH & CONTROLS TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-card border border-border/80 rounded-xl p-2.5 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products, SKUs, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* Stock filter */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30 text-[11px] shrink-0">
            <button
              onClick={() => setStockFilter('all')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", stockFilter === 'all' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground")}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('in_stock')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", stockFilter === 'in_stock' ? "bg-background text-emerald-600 shadow-2xs" : "text-muted-foreground")}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter('low_stock')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", stockFilter === 'low_stock' ? "bg-background text-amber-600 shadow-2xs" : "text-muted-foreground")}
            >
              Low (≤5)
            </button>
          </div>

          {/* Visibility filter */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30 text-[11px] shrink-0">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", visibilityFilter === 'all' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground")}
            >
              All
            </button>
            <button
              onClick={() => setVisibilityFilter('live')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", visibilityFilter === 'live' ? "bg-background text-emerald-600 shadow-2xs" : "text-muted-foreground")}
            >
              Live
            </button>
            <button
              onClick={() => setVisibilityFilter('draft')}
              className={cn("px-2.5 py-1 rounded-md font-medium transition-all", visibilityFilter === 'draft' ? "bg-background text-muted-foreground shadow-2xs" : "text-muted-foreground")}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. BULK ACTIONS TOOLBAR (Appears when items are selected) ── */}
      {selectedProductIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-emerald-950/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-900 dark:text-emerald-300">
              {selectedProductIds.length} {selectedProductIds.length === 1 ? 'Product' : 'Products'} Selected
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkUpdateVisibility(true)}
              disabled={isBulkProcessing}
              className="h-7 text-[11px] bg-background hover:bg-emerald-50 text-emerald-700 border-emerald-300"
            >
              Set Live
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkUpdateVisibility(false)}
              disabled={isBulkProcessing}
              className="h-7 text-[11px] bg-background text-muted-foreground"
            >
              Hide / Draft
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkUpdateStock(100)}
              disabled={isBulkProcessing}
              className="h-7 text-[11px] bg-background text-foreground"
            >
              Stock = 100
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkUpdateStock(0)}
              disabled={isBulkProcessing}
              className="h-7 text-[11px] bg-background text-amber-700"
            >
              Stock = 0
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="h-7 text-[11px]"
            >
              Delete Selected
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setSelectedProductIds([])}
              className="h-7 text-[11px] text-muted-foreground"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* ── 5. SCROLL-FREE COMPACT PRODUCTS TABLE ── */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs flex flex-col">
        {/* Table scroll container with fixed viewport height */}
        <div className="overflow-y-auto max-h-[calc(100vh-270px)] min-h-[380px] no-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10 border-b border-border/80">
              <TableRow className="hover:bg-transparent h-10">
                <TableHead className="w-10 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="w-12 px-2">Item</TableHead>
                <TableHead className="px-3 min-w-[200px]">Product & Category</TableHead>
                <TableHead className="px-3 min-w-[120px]">Price / MRP</TableHead>
                <TableHead className="px-3 min-w-[90px]">Variants</TableHead>
                <TableHead className="px-3 min-w-[110px]">Stock Status</TableHead>
                <TableHead className="px-3 min-w-[110px]">9:16 Reels</TableHead>
                <TableHead className="px-3 text-center min-w-[80px]">Live</TableHead>
                <TableHead className="px-3 text-right min-w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const stockQty = p.stockQuantity ?? p.stock ?? 10;
                  const isLow = stockQty <= 5;
                  const isOut = stockQty === 0;
                  const hasDiscount = p.mrpPrice && p.mrpPrice > (p.basePrice || p.price);
                  const discountPct = hasDiscount 
                    ? Math.round(((p.mrpPrice - (p.basePrice || p.price)) / p.mrpPrice) * 100)
                    : 0;
                  const defaultVar = p.vars?.find((v: any) => v.on) || p.vars?.[0];
                  const isSelected = selectedProductIds.includes(p.id);
                  const isLive = p.isLive !== false;
                  const reelsCount = Array.isArray(p.reels) ? p.reels.length : (p.videoUrl ? 1 : 0);

                  return (
                    <TableRow 
                      key={p.id} 
                      className={cn(
                        "border-b border-border/40 hover:bg-muted/30 transition-colors h-12 text-xs",
                        isSelected && "bg-emerald-50/40 dark:bg-emerald-950/20"
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell className="px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(p.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </TableCell>

                      {/* Thumbnail */}
                      <TableCell className="px-2 py-1.5">
                        <div className="relative w-9 h-9 rounded-md border border-border/80 overflow-hidden bg-muted/40 shrink-0">
                          {p.imageUrls?.[0] ? (
                            <Image
                              src={p.imageUrls[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Product Details */}
                      <TableCell className="px-3 py-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate max-w-[240px] sm:max-w-[300px]">
                              {p.name}
                            </span>
                            {p.badges?.[0] && (
                              <Badge variant="secondary" className="text-[9px] py-0 px-1 h-3.5 shrink-0">
                                {p.badges[0]}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="capitalize font-medium text-emerald-700 dark:text-emerald-400">
                              {p.categoryId || p.cat}
                            </span>
                            <span>•</span>
                            <span>{defaultVar?.s || p.vol || 'Standard'}</span>
                            {p.statusBadge && (
                              <>
                                <span>•</span>
                                <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1 rounded">
                                  {p.statusBadge}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Price & MRP */}
                      <TableCell className="px-3 py-1.5 font-mono">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-foreground">
                            ₹{(p.basePrice || p.price || 0).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              ₹{p.mrpPrice}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="text-[9px] text-emerald-600 font-bold">
                            {discountPct}% OFF
                          </span>
                        )}
                      </TableCell>

                      {/* Variants */}
                      <TableCell className="px-3 py-1.5">
                        <Badge variant="outline" className="font-mono text-[10px] h-5">
                          {p.vars?.length || 1} {(p.vars?.length || 1) === 1 ? 'Size' : 'Sizes'}
                        </Badge>
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell className="px-3 py-1.5">
                        {isOut ? (
                          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-[10px] h-5">
                            Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] h-5 gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            {stockQty} Left
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] h-5 gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            {stockQty} Stock
                          </Badge>
                        )}
                      </TableCell>

                      {/* 9:16 Reels */}
                      <TableCell className="px-3 py-1.5">
                        {reelsCount > 0 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 text-[10px] h-5 gap-1 font-mono">
                            <Film className="w-2.5 h-2.5" />
                            <span>{reelsCount} {reelsCount === 1 ? 'Reel' : 'Reels'}</span>
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No reel</span>
                        )}
                      </TableCell>

                      {/* Live Storefront Toggle */}
                      <TableCell className="px-3 py-1.5 text-center">
                        <Switch
                          checked={isLive}
                          onCheckedChange={() => handleToggleProductLive(p, { stopPropagation: () => {} } as any)}
                          aria-label="Toggle live status"
                          className="scale-75"
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-3 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(p)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit all fields"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="View on Storefront"
                          >
                            <Link href={`/product/${p.id}`} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(p)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-xs text-muted-foreground">
                    No products found matching your current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Compact table footer info */}
        <div className="p-2.5 border-t border-border/80 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Showing {filteredProducts.length} items</span>
          <span>Instant live sync with customer storefront</span>
        </div>
      </div>

      {/* ── 6. COMPACT, SCROLL-FREE ADD / EDIT PRODUCT DIALOG ── */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
        <DialogContent className="w-full max-w-4xl h-[90vh] max-h-[820px] p-0 flex flex-col overflow-hidden rounded-2xl bg-card border border-border shadow-2xl font-sans">
          
          {/* Fixed Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editingId ? `Edit Product: ${name || 'Untitled'}` : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                All fields here map 1-to-1 to Firestore and power the storefront view.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1 rounded-full text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">Store Status:</span>
                <span className={cn("font-bold text-[11px]", isLiveProduct ? "text-emerald-600" : "text-amber-600")}>
                  {isLiveProduct ? 'Live' : 'Draft'}
                </span>
                <Switch
                  checked={isLiveProduct}
                  onCheckedChange={setIsLiveProduct}
                  className="scale-75 ml-1"
                />
              </div>
            </div>
          </div>

          {/* Fixed Tabs Navigation */}
          <div className="px-6 pt-2 border-b border-border/60 bg-muted/10 shrink-0">
            <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab}>
              <TabsList className="grid grid-cols-6 h-9 w-full bg-muted/50 p-0.5">
                <TabsTrigger value="general" className="text-xs">General & Price</TabsTrigger>
                <TabsTrigger value="variants" className="text-xs">Sizes & Matrix</TabsTrigger>
                <TabsTrigger value="media" className="text-xs">Image Gallery</TabsTrigger>
                <TabsTrigger value="reels" className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  🎬 9:16 Reels
                </TabsTrigger>
                <TabsTrigger value="story" className="text-xs">Story & Care</TabsTrigger>
                <TabsTrigger value="badges" className="text-xs">Badges & Social</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Scrollable Form Body (Fixed inside modal with no runaway scrolling) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* ── TAB 1: GENERAL & PRICING ── */}
            {activeDialogTab === 'general' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Product Title / Display Name *</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. A2 Desi Gir Cow Cultured Bilona Ghee"
                    className="h-9 text-xs" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Category *</label>
                    <select
                      value={productCat}
                      onChange={(e) => setProductCat(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ghee">A2 Vedic Ghee</option>
                      <option value="sweets">Artisanal Sweets</option>
                      <option value="honey">Raw Wild Honey</option>
                      <option value="oils">Wood Pressed Oils</option>
                      <option value="pickles">Traditional Pickles</option>
                      <option value="combos">Healthy Combos</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Selling Price (₹) *</label>
                    <Input 
                      type="number"
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="e.g. 1099"
                      className="h-9 text-xs font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">MRP / Compare At (₹)</label>
                    <Input 
                      type="number"
                      value={mrpPrice} 
                      onChange={(e) => setMrpPrice(e.target.value)} 
                      placeholder="e.g. 1299"
                      className="h-9 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Stock Inventory Count</label>
                    <Input 
                      type="number"
                      value={stock} 
                      onChange={(e) => setStock(e.target.value)} 
                      placeholder="100"
                      className="h-9 text-xs font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Volume Unit</label>
                    <select
                      value={volumeUnit}
                      onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ml">Milliliters (ml)</option>
                      <option value="L">Liters (L)</option>
                      <option value="g">Grams (g)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="pack">Packs / Units</option>
                      <option value="custom">Custom Unit</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Status Tagline Badge</label>
                    <Input 
                      value={statusBadge} 
                      onChange={(e) => setStatusBadge(e.target.value)} 
                      placeholder="e.g. Creamy, Selling Fast, Low Glycemic"
                      className="h-9 text-xs" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Product Description</label>
                  <Textarea 
                    value={desc} 
                    onChange={(e) => setDesc(e.target.value)} 
                    rows={4}
                    placeholder="Describe the aroma, texture, artisanal craftsmanship, and taste profile..."
                    className="text-xs" 
                  />
                </div>
              </div>
            )}

            {/* ── TAB 2: SIZES & VARIANTS MATRIX ── */}
            {activeDialogTab === 'variants' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 p-3 rounded-lg border border-border/60">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Quick Preset Sizes for {volumeUnit.toUpperCase()}</h4>
                    <p className="text-[11px] text-muted-foreground">Click any preset to add it directly to this product matrix.</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {presetOptions[volumeUnit]?.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (variants.some(v => v.s === preset)) return;
                          const defaultP = Number(price) || (variants[0]?.p || 0);
                          const defaultM = Number(mrpPrice) || (variants[0]?.mrp || defaultP);
                          setVariants(prev => [...prev, { s: preset, p: defaultP, mrp: defaultM, on: prev.length === 0 }]);
                        }}
                        className="h-6 text-[10px] px-2 bg-background hover:bg-emerald-50"
                      >
                        + {preset}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom variant add form */}
                <div className="grid grid-cols-4 gap-2 bg-card p-3 rounded-lg border border-border/80">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Size / Label</label>
                    <Input 
                      placeholder="e.g. 500 ml" 
                      value={newVarSize} 
                      onChange={(e) => setNewVarSize(e.target.value)} 
                      className="h-8 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Selling Price (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="Price" 
                      value={newVarPrice} 
                      onChange={(e) => setNewVarPrice(e.target.value)} 
                      className="h-8 text-xs font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">MRP Price (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="MRP" 
                      value={newVarMrp} 
                      onChange={(e) => setNewVarMrp(e.target.value)} 
                      className="h-8 text-xs font-mono" 
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={() => {
                        if (!newVarSize.trim()) return;
                        const vPrice = Number(newVarPrice) || Number(price) || 0;
                        const vMrp = Number(newVarMrp) || Number(mrpPrice) || vPrice;
                        setVariants(prev => [...prev, { s: newVarSize.trim(), p: vPrice, mrp: vMrp, on: prev.length === 0 }]);
                        setNewVarSize('');
                        setNewVarPrice('');
                        setNewVarMrp('');
                      }}
                      className="h-8 w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
                    </Button>
                  </div>
                </div>

                {/* Existing variants table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40 h-8">
                      <TableRow>
                        <TableHead className="w-16 text-center text-[11px]">Default</TableHead>
                        <TableHead className="text-[11px]">Size / Net Weight</TableHead>
                        <TableHead className="text-[11px]">Selling Price (₹)</TableHead>
                        <TableHead className="text-[11px]">MRP Price (₹)</TableHead>
                        <TableHead className="w-12 text-center text-[11px]">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((v, i) => (
                        <TableRow key={i} className="h-10 text-xs">
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name="defaultVariant"
                              checked={Boolean(v.on)}
                              onChange={() => {
                                setVariants(prev => prev.map((item, idx) => ({ ...item, on: idx === i })));
                                setPrice(String(v.p));
                                setMrpPrice(String(v.mrp || v.p));
                              }}
                              className="w-4 h-4 text-emerald-600 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={v.s}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants(prev => prev.map((item, idx) => idx === i ? { ...item, s: val } : item));
                              }}
                              className="h-7 text-xs max-w-[180px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={v.p}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setVariants(prev => prev.map((item, idx) => idx === i ? { ...item, p: val } : item));
                                if (v.on) setPrice(String(val));
                              }}
                              className="h-7 text-xs font-mono max-w-[120px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={v.mrp || v.p}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setVariants(prev => prev.map((item, idx) => idx === i ? { ...item, mrp: val } : item));
                                if (v.on) setMrpPrice(String(val));
                              }}
                              className="h-7 text-xs font-mono max-w-[120px]"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (variants.length <= 1) {
                                  toast({ variant: "destructive", title: "Cannot delete", description: "At least 1 variant is required." });
                                  return;
                                }
                                setVariants(prev => prev.filter((_, idx) => idx !== i));
                              }}
                              className="h-7 w-7 text-destructive/70 hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ── TAB 3: IMAGE GALLERY ── */}
            {activeDialogTab === 'media' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter image URL (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button type="button" onClick={handleAddImageUrl} className="h-9 text-xs bg-emerald-600 text-white shrink-0">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Image
                  </Button>
                </div>

                {/* Quick Presets Picker */}
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground mr-2">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRESET_IMAGES.map((img) => (
                      <Button
                        key={img.url}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!uploadedImages.includes(img.url)) {
                            setUploadedImages(prev => [...prev, img.url]);
                          }
                        }}
                        className="h-6 text-[10px] px-2 bg-background hover:bg-emerald-50"
                      >
                        + {img.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {uploadedImages.map((url, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 bg-muted/20 group shadow-xs",
                        idx === 0 ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-border"
                      )}
                    >
                      <Image src={url} alt="" fill className="object-cover" />
                      
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          PRIMARY
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {idx !== 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setPrimaryImage(idx)}
                            className="h-6 text-[10px] px-2"
                          >
                            Set Cover
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeImage(idx)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 4: 9:16 VIDEO REELS (TIED TO PRODUCT) ── */}
            {activeDialogTab === 'reels' && (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-500/20 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">9:16 Instagram Reels Tied To This Product</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Upload or link vertical 9:16 reels showcasing this product. Reel titles will automatically match & feature: <strong className="text-foreground">{name || 'Your Product'}</strong>.
                    </p>
                  </div>
                </div>

                {/* Add new reel form */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-card border border-border/80 rounded-xl p-4 shadow-xs">
                  
                  {/* Left Column: Form Fields */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Reel Title Suffix</label>
                        <Input
                          value={reelTitleSuffix}
                          onChange={(e) => setReelTitleSuffix(e.target.value)}
                          placeholder="e.g. Sacred Process, Purity Test"
                          className="h-8 text-xs"
                        />
                        <span className="text-[10px] text-muted-foreground block">
                          Result: &ldquo;{name || 'Product'} — {reelTitleSuffix}&rdquo;
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Subtitle / Location</label>
                        <Input
                          value={reelSubtitle}
                          onChange={(e) => setReelSubtitle(e.target.value)}
                          placeholder="e.g. Gujarat Organic Farm"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Direct MP4 Video Stream URL *</label>
                      <Input
                        value={reelVideoUrl}
                        onChange={(e) => setReelVideoUrl(e.target.value)}
                        placeholder="https://.../video.mp4"
                        className="h-8 text-xs font-mono"
                      />
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-muted-foreground">Quick Test Video:</span>
                        {PRESET_SAMPLE_VIDEOS.map((pv, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReelVideoUrl(pv.url)}
                            className="text-[10px] text-emerald-600 hover:underline font-medium"
                          >
                            {pv.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Poster Cover Image URL</label>
                        <Input
                          value={reelPosterUrl}
                          onChange={(e) => setReelPosterUrl(e.target.value)}
                          placeholder="Default will use product image"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Reel Tag</label>
                        <Input
                          value={reelTag}
                          onChange={(e) => setReelTag(e.target.value)}
                          placeholder="e.g. 100% Vedic Process"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Instagram Caption</label>
                      <Textarea
                        value={reelCaption}
                        onChange={(e) => setReelCaption(e.target.value)}
                        rows={2}
                        placeholder="Caption with emojis and farm stories..."
                        className="text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddReel}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add 9:16 Reel to Product</span>
                    </Button>
                  </div>

                  {/* Right Column: Interactive 9:16 Preview Card */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-2 bg-muted/30 rounded-xl border border-border/60">
                    <span className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                      9:16 Vertical Preview
                    </span>
                    <div className="relative w-36 aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-md border-2 border-purple-500/40">
                      {reelVideoUrl ? (
                        <video
                          src={reelVideoUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 p-2 text-center">
                          <Film className="w-6 h-6 mb-1 opacity-70" />
                          <span className="text-[9px]">Enter video URL to preview</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                      <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                        <p className="text-[9px] font-bold leading-tight truncate">
                          {name || 'Product'} — {reelTitleSuffix}
                        </p>
                        <p className="text-[8px] text-white/80 truncate">{reelSubtitle}</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* List of configured reels */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Active Reels for this Product ({reels.length})
                  </h4>

                  {reels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {reels.map((r, i) => (
                        <div key={r.id || i} className="bg-card border border-border rounded-xl p-3 flex gap-3 shadow-xs relative group">
                          <div className="relative w-16 aspect-[9/16] rounded-lg overflow-hidden bg-black shrink-0 border border-border/80">
                            <video src={r.videoUrl} poster={r.posterUrl} className="w-full h-full object-cover" muted playsInline />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="font-bold text-xs text-foreground truncate">{r.title}</h5>
                              <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{r.caption}</p>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border/60">
                              <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                                {r.viewsLabel || '28.4k'}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveReel(r.id)}
                                className="h-5 w-5 text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      No custom reels added yet. The storefront will generate automatic 9:16 reels titled with this product.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 5: STORY, INGREDIENTS & CARE ── */}
            {activeDialogTab === 'story' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">What’s Inside / Ingredients (1 per line)</label>
                    <Textarea 
                      value={ingredientsText} 
                      onChange={(e) => setIngredientsText(e.target.value)} 
                      rows={4}
                      placeholder="e.g.&#10;100% Pure Cultured Indigenous Milk Fat&#10;Natural Butyric Acid & CLA&#10;Fat-Soluble Vitamins A, D, E, K2"
                      className="text-xs" 
                    />
                    <span className="text-[10px] text-muted-foreground">Powers the &ldquo;WHAT&apos;S INSIDE&rdquo; accordion on the product page.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Health Benefits & Results (1 per line)</label>
                    <Textarea 
                      value={benefitsText} 
                      onChange={(e) => setBenefitsText(e.target.value)} 
                      rows={4}
                      placeholder="e.g.&#10;Smooth, gentle digestion without heaviness&#10;Sustained clean energy for mind & body&#10;Natural Ayurvedic lubrication"
                      className="text-xs" 
                    />
                    <span className="text-[10px] text-muted-foreground">Powers the &ldquo;RESULTS YOU&apos;LL NOTICE&rdquo; accordion.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">How It’s Made / Handcrafted Process</label>
                    <Textarea 
                      value={howMadeText} 
                      onChange={(e) => setHowMadeText(e.target.value)} 
                      rows={3}
                      placeholder="e.g. Handcrafted following the sacred 5-step Vedic Bilona method: pasture grazing, earthen curd culturing, wooden bilona churning, slow firewood simmer..."
                      className="text-xs" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Cooking & Storage Care</label>
                    <Textarea 
                      value={cookingCareText} 
                      onChange={(e) => setCookingCareText(e.target.value)} 
                      rows={3}
                      placeholder="e.g. Store at room temperature in a dry spot. High smoke point of 250°C. Does not require refrigeration."
                      className="text-xs" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: BADGES, PROMOTIONS & SOCIAL PROOF ── */}
            {activeDialogTab === 'badges' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Top Highlight Badge</label>
                    <Input 
                      value={topBadge} 
                      onChange={(e) => setTopBadge(e.target.value)} 
                      placeholder="e.g. Bestseller, Top Rated, Heritage"
                      className="h-9 text-xs" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Sold Count Social Proof</label>
                    <Input 
                      value={soldLabel} 
                      onChange={(e) => setSoldLabel(e.target.value)} 
                      placeholder="e.g. 12.4k+ delivered"
                      className="h-9 text-xs" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Purity Coins Reward</label>
                    <Input 
                      type="number"
                      value={rewardCoins} 
                      onChange={(e) => setRewardCoins(e.target.value)} 
                      placeholder="e.g. 110"
                      className="h-9 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Exclusive Coupon Code</label>
                    <Input 
                      value={productCoupon} 
                      onChange={(e) => setProductCoupon(e.target.value)} 
                      placeholder="e.g. PURE15"
                      className="h-9 text-xs uppercase font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Rating Display</label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={rating} 
                      onChange={(e) => setRating(e.target.value)} 
                      placeholder="4.9"
                      className="h-9 text-xs font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Reviews Count</label>
                    <Input 
                      type="number"
                      value={reviews} 
                      onChange={(e) => setReviews(e.target.value)} 
                      placeholder="1420"
                      className="h-9 text-xs font-mono" 
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Fixed Footer (Always visible with zero scrolling!) */}
          <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/30 shrink-0">
            <span className="text-[11px] text-muted-foreground font-mono">
              {editingId ? `ID: ${editingId}` : 'New Product draft'}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                size="sm"
                onClick={handleSave} 
                disabled={isSaving}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px] shadow-xs"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : editingId ? (
                  'Update Product'
                ) : (
                  'Publish Product'
                )}
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
};
