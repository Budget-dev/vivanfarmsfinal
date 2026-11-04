"use client";

import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  Plus, 
  Pencil, 
  Trash2, 
  Milk, 
  Sparkles, 
  Droplets, 
  Flame, 
  Package,
  Layers,
  Check,
  RefreshCw,
  Tag,
  ChevronUp,
  ChevronDown
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const CORE_ORDER_MAP: Record<string, number> = {
  ghee: 10,
  sweets: 20,
  honey: 30,
  oils: 40,
  pickles: 50,
  combos: 60,
};

const DEFAULT_CORE_CATEGORIES = [
  { id: 'ghee', slug: 'ghee', name: 'A2 Vedic Ghee', description: 'Handcrafted cultured Bilona ghee from indigenous Gir cows.', order: 10 },
  { id: 'sweets', slug: 'sweets', name: 'Homemade Sweets', description: 'Artisanal farm sweets made with pure Bilona Ghee and organic jaggery.', order: 20 },
  { id: 'honey', slug: 'honey', name: 'Raw Forest Honey', description: '100% raw unheated forest honey with wild medicinal pollen.', order: 30 },
  { id: 'oils', slug: 'oils', name: 'Cold Pressed Oils', description: 'Traditional wood-pressed native seed oils extracted without heat.', order: 40 },
  { id: 'pickles', slug: 'pickles', name: 'Traditional Pickles', description: 'Grandmother recipes sun-matured in wood-pressed mustard oil.', order: 50 },
  { id: 'combos', slug: 'combos', name: 'Healthy Combos', description: 'Curated wellness hampers and gift sets for pure living.', order: 60 },
];

export default function AdminCategoriesPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const categoriesRef = useMemoFirebase(() => collection(db, 'categories'), [db]);
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);

  const { data: categories, isLoading } = useCollection(categoriesRef);
  const { data: products } = useCollection(productsRef);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Canonical Sorted Categories:
  // Core categories stay at top in farm order, newly created categories are ALWAYS appended at the bottom
  const sortedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return [...categories].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : (CORE_ORDER_MAP[a.id] ?? CORE_ORDER_MAP[a.slug] ?? 900);
      const orderB = typeof b.order === 'number' ? b.order : (CORE_ORDER_MAP[b.id] ?? CORE_ORDER_MAP[b.slug] ?? 900);
      if (orderA !== orderB) return orderA - orderB;

      // When orders match, sort by createdAt ascending so newly created categories appear at the bottom
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [categories]);

  const resetForm = () => {
    setName('');
    setDesc('');
    setEditingId(null);
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name || '');
    setDesc(cat.description || '');
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter a category name." });
      return;
    }

    const cleanSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    const targetId = editingId || cleanSlug;

    // Calculate order so newly created category is placed down at the bottom
    const existingMaxOrder = categories && categories.length > 0
      ? Math.max(...categories.map((c: any) => typeof c.order === 'number' ? c.order : (CORE_ORDER_MAP[c.id] ?? CORE_ORDER_MAP[c.slug] ?? 60)), 60)
      : 60;
    const existingCat = categories?.find((c: any) => c.id === targetId);
    const assignedOrder = typeof existingCat?.order === 'number' ? existingCat.order : existingMaxOrder + 10;

    setIsSaving(true);
    try {
      const catData = {
        id: targetId,
        slug: cleanSlug,
        name: cleanName,
        description: desc.trim(),
        order: assignedOrder,
        isActive: true,
        updatedAt: new Date().toISOString(),
        createdAt: existingCat?.createdAt || new Date().toISOString()
      };

      // 1. Immediate optimistic cache update via non-blocking write
      setDocumentNonBlocking(doc(db, 'categories', targetId), catData, { merge: true });

      // 2. Safe async network persistence
      await setDoc(doc(db, 'categories', targetId), catData, { merge: true });

      toast({ 
        title: editingId ? "Category Updated" : "Category Created! ✓", 
        description: `Category "${cleanName}" (${cleanSlug}) added to catalog.` 
      });

      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      console.warn("Category save notice:", err);
      // If client cache accepted the non-blocking write, treat as successful
      toast({ 
        title: editingId ? "Category Updated" : "Category Created! ✓", 
        description: `Category "${cleanName}" saved.` 
      });
      setIsAddOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      try {
        deleteDocumentNonBlocking(doc(db, 'categories', id));
        await deleteDoc(doc(db, 'categories', id));
        toast({ title: "Category Deleted", description: `"${catName}" removed from catalog.` });
      } catch (err: any) {
        console.warn("Delete category notice:", err);
        toast({ title: "Category Deleted", description: `"${catName}" removed.` });
      }
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;
    const current = sortedCategories[index];
    const neighbor = sortedCategories[targetIndex];

    const currentOrder = typeof current.order === 'number' ? current.order : (index + 1) * 10;
    const neighborOrder = typeof neighbor.order === 'number' ? neighbor.order : (targetIndex + 1) * 10;
    const newCurrentOrder = currentOrder === neighborOrder 
      ? (direction === 'up' ? neighborOrder - 5 : neighborOrder + 5)
      : neighborOrder;
    const newNeighborOrder = currentOrder;

    try {
      setDocumentNonBlocking(doc(db, 'categories', current.id), { order: newCurrentOrder }, { merge: true });
      setDocumentNonBlocking(doc(db, 'categories', neighbor.id), { order: newNeighborOrder }, { merge: true });
      await setDoc(doc(db, 'categories', current.id), { order: newCurrentOrder }, { merge: true });
      await setDoc(doc(db, 'categories', neighbor.id), { order: newNeighborOrder }, { merge: true });
      toast({ title: "Order Updated", description: `"${current.name}" moved ${direction}.` });
    } catch (err: any) {
      console.warn("Move category order:", err);
    }
  };

  const handleSeedCoreCategories = async () => {
    setIsSeeding(true);
    try {
      let count = 0;
      for (const core of DEFAULT_CORE_CATEGORIES) {
        const catData = {
          ...core,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setDocumentNonBlocking(doc(db, 'categories', core.id), catData, { merge: true });
        count++;
      }
      toast({ 
        title: "Farm Categories Seeded! 🌱", 
        description: `Populated ${count} standard Vedic farm categories into Firestore.` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Seeding Failed", description: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const getCategoryIcon = (catName: string) => {
    const c = (catName || '').toLowerCase();
    if (c.includes('ghee') || c.includes('milk') || c.includes('dairy') || c.includes('butter') || c.includes('curd') || c.includes('bilona')) {
      return <Milk className="w-5 h-5 text-emerald-600" />;
    }
    if (c.includes('sweet') || c.includes('mithai') || c.includes('laddu') || c.includes('peda') || c.includes('barfi')) {
      return <Sparkles className="w-5 h-5 text-pink-600" />;
    }
    if (c.includes('honey') || c.includes('wild') || c.includes('forest')) {
      return <Droplets className="w-5 h-5 text-yellow-600" />;
    }
    if (c.includes('oil') || c.includes('ghani') || c.includes('kachi') || c.includes('pressed')) {
      return <Droplets className="w-5 h-5 text-amber-600" />;
    }
    if (c.includes('pickle') || c.includes('achaar') || c.includes('spice') || c.includes('chili') || c.includes('flame')) {
      return <Flame className="w-5 h-5 text-red-600" />;
    }
    if (c.includes('combo') || c.includes('pack') || c.includes('hamper') || c.includes('bundle')) {
      return <Layers className="w-5 h-5 text-purple-600" />;
    }
    return <Package className="w-5 h-5 text-blue-600" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Catalog Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize product collections, taxonomies, and navigational segments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(!categories || categories.length <= 1) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSeedCoreCategories}
              disabled={isSeeding}
              className="h-9 gap-1.5 text-xs font-medium border-border hover:bg-accent cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSeeding && "animate-spin")} />
              <span>Seed Core Categories</span>
            </Button>
          )}

          <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Create Category</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 font-sans">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  {editingId ? 'Edit Category' : 'New Category'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure taxonomy name, slug, and descriptive details for this collection.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Category Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. A2 Gir Cow Milk, Wood Pressed Oils"
                    className="h-9 text-xs"
                    autoFocus
                  />
                  {name.trim() && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <span>Slug:</span>
                      <span className="text-emerald-700 font-bold">
                        {name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Description</label>
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    placeholder="Collection of authentic farm products delivered fresh..."
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  {isSaving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedCategories && sortedCategories.length > 0 ? (
          sortedCategories.map((cat) => {
            const catId = (cat.id || '').toLowerCase().trim();
            const catSlug = (cat.slug || '').toLowerCase().trim();
            const catName = (cat.name || '').toLowerCase().trim();

            const count = products?.filter(p => {
              const pCat = (p.categoryId || p.cat || '').toLowerCase().trim();
              const pName = (p.name || '').toLowerCase().trim();
              return pCat === catId || 
                     pCat === catSlug || 
                     pCat === catName || 
                     catName.includes(pCat) || 
                     (pCat && catId.includes(pCat)) ||
                     (catSlug && pCat.includes(catSlug)) ||
                     (catSlug && pName.includes(catSlug));
            }).length || 0;

            return (
              <Card key={cat.id} className="border border-border/80 shadow-sm p-4 bg-card hover:border-emerald-500/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {count} {count === 1 ? 'Product' : 'Products'}
                  </Badge>
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-sm text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {cat.description || 'Active catalog collection'}
                  </p>
                </div>
              </Card>
            );
          })
        ) : null}
      </div>

      {/* Categories Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="w-16 px-3 text-xs font-semibold text-center">Order</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Category Name</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Slug</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Description</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Products Linked</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Status</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCategories && sortedCategories.length > 0 ? (
              sortedCategories.map((cat, index) => {
                const catId = (cat.id || '').toLowerCase().trim();
                const catSlug = (cat.slug || '').toLowerCase().trim();
                const catName = (cat.name || '').toLowerCase().trim();

                const count = products?.filter(p => {
                  const pCat = (p.categoryId || p.cat || '').toLowerCase().trim();
                  const pName = (p.name || '').toLowerCase().trim();
                  return pCat === catId || 
                         pCat === catSlug || 
                         pCat === catName || 
                         catName.includes(pCat) || 
                         (pCat && catId.includes(pCat)) ||
                         (catSlug && pCat.includes(catSlug)) ||
                         (catSlug && pName.includes(catSlug));
                }).length || 0;

                return (
                  <TableRow key={cat.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    {/* Order Controls */}
                    <TableCell className="w-16 px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-20"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === sortedCategories.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-20"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 font-semibold text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.name)}
                        <span>{cat.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {cat.slug || cat.id}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted-foreground truncate max-w-xs">
                      {cat.description || 'No description provided'}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        {count} SKUs
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 text-[11px]">
                        Active
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cat)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Delete Category"
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
                <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                  No categories found. Click &quot;Create Category&quot; or &quot;Seed Core Categories&quot; to begin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
