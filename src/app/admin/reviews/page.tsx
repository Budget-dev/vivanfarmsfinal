"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Trash2, 
  MessageSquare, 
  ShieldCheck, 
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ProductReview, ReviewStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminReviewsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const reviewsRef = useMemoFirebase(() => collection(db, 'reviews'), [db]);
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);

  const { data: rawReviews, isLoading: reviewsLoading } = useCollection(reviewsRef);
  const { data: rawProducts } = useCollection(productsRef);

  const [activeTab, setActiveTab] = useState<ReviewStatus | 'all'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [targetReviewForReject, setTargetReviewForReject] = useState<ProductReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Products lookup map
  const productsMap = useMemo(() => {
    const map = new Map<string, { name: string; image?: string }>();
    if (rawProducts) {
      rawProducts.forEach((p: any) => {
        map.set(p.id, {
          name: p.name || 'Unknown Product',
          image: p.imageUrls?.[0] || undefined
        });
      });
    }
    return map;
  }, [rawProducts]);

  // Typed ProductReviews list
  const reviews: ProductReview[] = useMemo(() => {
    if (!rawReviews) return [];
    return rawReviews.map((r: any) => ({
      id: r.id,
      productId: r.productId || '',
      productName: r.productName || productsMap.get(r.productId)?.name || 'Product #' + r.productId,
      productImage: r.productImage || productsMap.get(r.productId)?.image,
      userId: r.userId || '',
      userName: r.userName || 'Anonymous',
      userEmail: r.userEmail || '',
      rating: Number(r.rating) || 5,
      title: r.title || 'No Title',
      comment: r.comment || '',
      images: Array.isArray(r.images) ? r.images : (Array.isArray(r.imageUrls) ? r.imageUrls : []),
      status: (r.status as ReviewStatus) || 'pending',
      adminComment: r.adminComment || '',
      verifiedPurchase: Boolean(r.verifiedPurchase),
      helpfulCount: Number(r.helpfulCount) || 0,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawReviews, productsMap]);

  // Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;
    
    const approvedReviews = reviews.filter(r => r.status === 'approved');
    const avgRating = approvedReviews.length > 0 
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '5.0';

    return { total, pending, approved, rejected, avgRating };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeTab !== 'all' && r.status !== activeTab) return false;
      if (selectedProductId !== 'all' && r.productId !== selectedProductId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.userName.toLowerCase().includes(q);
        const matchesEmail = (r.userEmail || '').toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesComment = r.comment.toLowerCase().includes(q);
        const matchesProduct = (r.productName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesTitle && !matchesComment && !matchesProduct) {
          return false;
        }
      }
      return true;
    });
  }, [reviews, activeTab, selectedProductId, searchQuery]);

  // Sync product average rating in Firestore
  const syncProductRatingAndCount = async (productId: string) => {
    if (!productId) return;
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      const approvedList = snapshot.docs.map((d: any) => d.data());
      const reviewCount = approvedList.length;
      let rating = 5.0;
      if (reviewCount > 0) {
        const totalScore = approvedList.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 5), 0);
        rating = Number((totalScore / reviewCount).toFixed(1));
      }
      
      const productRef = doc(db, 'products', productId);
      await setDoc(productRef, { rating, reviewCount }, { merge: true });
    } catch (error) {
      console.error('Failed to sync product stats:', error);
    }
  };

  const handleApprove = async (review: ProductReview) => {
    setIsProcessing(true);
    try {
      const reviewRef = doc(db, 'reviews', review.id);
      await updateDoc(reviewRef, {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
      await syncProductRatingAndCount(review.productId);
      toast({
        title: "Review Approved",
        description: `Review by ${review.userName} is now published on the product page.`,
      });
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (review: ProductReview) => {
    setTargetReviewForReject(review);
    setRejectionReason(review.adminComment || '');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetReviewForReject) return;
    setIsProcessing(true);
    try {
      const reviewRef = doc(db, 'reviews', targetReviewForReject.id);
      await updateDoc(reviewRef, {
        status: 'rejected',
        adminComment: rejectionReason.trim(),
        updatedAt: new Date().toISOString()
      });
      await syncProductRatingAndCount(targetReviewForReject.productId);
      toast({
        title: "Review Rejected",
        description: `Review by ${targetReviewForReject.userName} has been rejected.`,
      });
      setRejectDialogOpen(false);
      setTargetReviewForReject(null);
      setRejectionReason('');
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (review: ProductReview) => {
    if (confirm(`Are you sure you want to permanently delete this review by ${review.userName}?`)) {
      try {
        await deleteDoc(doc(db, 'reviews', review.id));
        await syncProductRatingAndCount(review.productId);
        toast({ title: "Review Deleted", description: "Review has been permanently removed." });
      } catch (err: any) {
        toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
      }
    }
  };

  if (reviewsLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing customer reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Customer Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Moderate customer product feedback, verify authentic purchases, and manage store ratings.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground">Total Reviews</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Submitted by customers</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-amber-600">Pending Moderation</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">{stats.pending}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Awaiting admin review</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-emerald-600">Approved Reviews</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{stats.approved}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Published on store</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-foreground flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Average Rating
          </div>
          <div className="text-2xl font-bold mt-1">{stats.avgRating} / 5.0</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Storewide average</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/80 shadow-sm">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, title, comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="overflow-x-auto w-full md:w-auto">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">Approved ({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">Rejected ({stats.rejected})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="px-4 text-xs font-semibold">Customer</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Product</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Rating & Review</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Status</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Date</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-right">Moderation Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((r) => {
                const initials = r.userName.substring(0, 2).toUpperCase();

                return (
                  <TableRow key={r.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                            {r.userName}
                            {r.verifiedPurchase && (
                              <span title="Verified Purchase">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {r.userEmail || 'Anonymous'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded border border-border/80 overflow-hidden bg-muted/40 shrink-0">
                          {r.productImage ? (
                            <Image src={r.productImage} alt={r.productName || 'Product'} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                              Farm
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground truncate max-w-[140px]" title={r.productName}>
                          {r.productName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-3 h-3",
                                star <= r.rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-medium text-foreground">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{r.comment}</p>
                        {r.adminComment && (
                          <p className="text-[10px] text-red-600 bg-red-50 p-1 rounded border border-red-100">
                            Reason: {r.adminComment}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {r.status === 'approved' && (
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 text-[11px]">
                          Approved
                        </Badge>
                      )}
                      {r.status === 'pending' && (
                        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/30 text-[11px]">
                          Pending
                        </Badge>
                      )}
                      {r.status === 'rejected' && (
                        <Badge variant="destructive" className="text-[11px]">
                          Rejected
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(r)}
                            disabled={isProcessing}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Approve Review"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {r.status !== 'rejected' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRejectModal(r)}
                            disabled={isProcessing}
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Reject Review"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(r)}
                          disabled={isProcessing}
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          title="Delete Review"
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
                <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                  No reviews found matching the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Rejection Modal Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Reject Review</DialogTitle>
            <DialogDescription className="text-xs">
              Provide an optional moderation note explaining why this review was rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="e.g. Inappropriate content, competitor spam, off-topic..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmReject} disabled={isProcessing}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
