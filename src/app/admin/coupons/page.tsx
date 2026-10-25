"use client";

import React, { useState } from 'react';
import { 
  Ticket, 
  Trash2, 
  Tag, 
  Calendar, 
  Layers, 
  Zap, 
  Plus, 
  Copy, 
  Check, 
  Percent, 
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminCouponsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const couponsRef = useMemoFirebase(() => collection(db, 'universalCoupons'), [db]);
  const { data: coupons, isLoading } = useCollection(couponsRef);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'flat' | 'percentage'>('flat');
  const [value, setValue] = useState('');
  const [limit, setLimit] = useState('100');
  const [expiry, setExpiry] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (cCode: string, id: string) => {
    navigator.clipboard.writeText(cCode);
    setCopiedId(id);
    toast({ title: "Copied", description: `Code ${cCode} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = () => {
    if (!code || !value) {
      toast({ variant: "destructive", title: "Missing Information", description: "Coupon code and discount value are required." });
      return;
    }

    const newCoupon = {
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      usageLimit: Number(limit) || 100,
      usedCount: 0,
      expiryDate: expiry || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(db, 'universalCoupons'), newCoupon);
    toast({ title: "Coupon Created", description: `Coupon ${code.toUpperCase()} is now active across checkout.` });
    setIsAddOpen(false);
    setCode(''); setValue('');
  };

  const toggleStatus = (id: string, current: boolean) => {
    updateDocumentNonBlocking(doc(db, 'universalCoupons', id), { isActive: !current });
    toast({ title: "Status Updated", description: `Coupon ${!current ? 'activated' : 'disabled'}.` });
  };

  const handleDelete = (id: string, cCode: string) => {
    if (confirm(`Are you sure you want to delete coupon ${cCode}?`)) {
      deleteDocumentNonBlocking(doc(db, 'universalCoupons', id));
      toast({ title: "Coupon Deleted", description: `Coupon ${cCode} removed.` });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing coupons...</p>
      </div>
    );
  }

  const activeCount = coupons?.filter(c => c.isActive).length || 0;
  const totalUses = coupons?.reduce((acc, c) => acc + (c.usedCount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Discount Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create universal store promotion codes, limit usage, and track redemption.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-6 font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">New Universal Coupon</DialogTitle>
              <DialogDescription className="text-xs">
                Create a discount code redeemable by all shoppers at checkout.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Coupon Code</label>
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="e.g. VIVAAN20" 
                  className="h-9 text-xs font-mono font-bold uppercase" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Discount Type</label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Discount Value</label>
                  <Input 
                    type="number" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    placeholder={type === 'flat' ? '₹100' : '10%'} 
                    className="h-9 text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Max Redemptions</label>
                  <Input 
                    type="number" 
                    value={limit} 
                    onChange={(e) => setLimit(e.target.value)} 
                    placeholder="100" 
                    className="h-9 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                  <Input 
                    type="date" 
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Publish Coupon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground">Active Coupons</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{activeCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Live on storefront checkout</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground">Total Redemptions</div>
          <div className="text-2xl font-bold mt-1">{totalUses}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Used by shoppers</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground">Coupon Types</div>
          <div className="text-2xl font-bold mt-1">{coupons?.length || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Configured promotion codes</div>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="px-4 text-xs font-semibold">Code</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Discount</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Usage & Quota</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Valid Until</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Status</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons && coupons.length > 0 ? (
              coupons.map((c) => {
                const isExpired = c.expiryDate && new Date(c.expiryDate).getTime() < Date.now();
                const usagePercent = Math.min(100, Math.round(((c.usedCount || 0) / (c.usageLimit || 1)) * 100));

                return (
                  <TableRow key={c.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                          {c.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyCode(c.code, c.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Copy Code"
                        >
                          {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 font-semibold text-xs text-foreground">
                      {c.type === 'flat' ? `₹${c.value} Flat OFF` : `${c.value}% OFF`}
                    </TableCell>

                    <TableCell className="px-4 py-3 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{c.usedCount || 0} used</span>
                          <span>{c.usageLimit} limit</span>
                        </div>
                        <Progress value={usagePercent} className="h-1.5" />
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {c.expiryDate 
                        ? new Date(c.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'No Expiry'
                      }
                      {isExpired && <span className="text-[10px] text-destructive block">Expired</span>}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {c.isActive && !isExpired ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 text-[11px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px]">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(c.id, c.isActive)}
                          className="h-7 text-xs px-2.5"
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c.id, c.code)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Delete Coupon"
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
                  No coupons found. Click &quot;Create Coupon&quot; to issue your first discount.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
