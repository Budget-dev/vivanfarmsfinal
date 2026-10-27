"use client";

import React, { useState } from 'react';
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
  Check
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
import { collection, doc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Name Required", description: "Category name is required." });
      return;
    }

    setIsSaving(true);
    try {
      const catData = {
        name: name.trim(),
        description: desc.trim(),
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await setDoc(doc(db, 'categories', editingId), catData, { merge: true });
        toast({ title: "Category Updated", description: `${name} has been updated.` });
      } else {
        await addDoc(collection(db, 'categories'), { ...catData, createdAt: new Date().toISOString() });
        toast({ title: "Category Created", description: `${name} added to catalog categories.` });
      }

      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to save category." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast({ title: "Category Deleted", description: `${catName} removed from catalog.` });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: err.message });
      }
    }
  };

  const getCategoryIcon = (catName: string) => {
    const c = catName.toLowerCase();
    if (c.includes('ghee')) return <Milk className="w-5 h-5 text-emerald-600" />;
    if (c.includes('sweet')) return <Sparkles className="w-5 h-5 text-pink-600" />;
    if (c.includes('honey')) return <Droplets className="w-5 h-5 text-yellow-600" />;
    if (c.includes('pickle')) return <Flame className="w-5 h-5 text-red-600" />;
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

        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
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
                Configure taxonomy name and descriptive details for this collection.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. A2 Bilona Ghee"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <Textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="Collection of authentic farm products..."
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSaving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories && categories.length > 0 ? (
          categories.map((cat) => {
            const count = products?.filter(p => {
              const pCat = (p.categoryId || p.cat || '').toLowerCase();
              const catName = (cat.name || '').toLowerCase();
              const catId = (cat.id || '').toLowerCase();
              return pCat === catId || pCat === catName || catName.includes(pCat) || (pCat && catId.includes(pCat));
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
              <TableHead className="px-4 text-xs font-semibold">Category Name</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Description</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Products Linked</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Status</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories && categories.length > 0 ? (
              categories.map((cat) => {
                const count = products?.filter(p => {
              const pCat = (p.categoryId || p.cat || '').toLowerCase();
              const catName = (cat.name || '').toLowerCase();
              const catId = (cat.id || '').toLowerCase();
              return pCat === catId || pCat === catName || catName.includes(pCat) || (pCat && catId.includes(pCat));
            }).length || 0;

                return (
                  <TableRow key={cat.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="px-4 py-3 font-semibold text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.name)}
                        <span>{cat.name}</span>
                      </div>
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
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
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
                <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                  No categories found. Click &quot;Create Category&quot; to add your first.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
