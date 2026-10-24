"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
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
  AlertTriangle
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ProductReview, ReviewStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminReviewsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Firestore references
  const reviewsRef = useMemoFirebase(() => collection(db, 'reviews'), [db]);
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);

  const { data: rawReviews, isLoading: reviewsLoading } = useCollection(reviewsRef);
  const { data: rawProducts } = useCollection(productsRef);

  // States for filter, search, selection & dialogs
  const [activeTab, setActiveTab] = useState<ReviewStatus | 'all'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [targetReviewForReject, setTargetReviewForReject] = useState<ProductReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Processing state
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

  // Map raw reviews to typed ProductReview objects
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
      : '0.0';

    return { total, pending, approved, rejected, avgRating };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Status filter
      if (activeTab !== 'all' && r.status !== activeTab) return false;
      // Product filter
      if (selectedProductId !== 'all' && r.productId !== selectedProductId) return false;
      // Search query
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

  // Recalculate product statistics in Firestore when reviews are approved/rejected/deleted
  const syncProductRatingAndCount = async (productId: string) => {
    if (!productId) return;
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      const approvedList = snapshot.docs.map((doc: any) => doc.data());
      const reviewCount = approvedList.length;
      let rating = 5.0;
      if (reviewCount > 0) {
        const totalScore = approvedList.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 5), 0);
        rating = Number((totalScore / reviewCount).toFixed(1));
      }
      
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        rating: rating,
        reviewCount: reviewCount
      });
    } catch (error) {
      console.error('Failed to sync product stats:', error);
    }
  };

  // Moderation Handlers
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
        description: `Review by ${review.userName} is now live on the store.`,
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Could not approve review",
        variant: "destructive"
      });
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
        description: `Review by ${targetReviewForReject.userName} has been marked as rejected.`,
      });

      setRejectDialogOpen(false);
      setTargetReviewForReject(null);
      setRejectionReason('');
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Could not reject review",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPending = async (review: ProductReview) => {
    setIsProcessing(true);
    try {
      const reviewRef = doc(db, 'reviews', review.id);
      await updateDoc(reviewRef, {
        status: 'pending',
        updatedAt: new Date().toISOString()
      });

      await syncProductRatingAndCount(review.productId);

      toast({
        title: "Status Reset to Pending",
        description: "Review returned to moderation queue.",
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to reset review status",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVerified = async (review: ProductReview) => {
    try {
      const reviewRef = doc(db, 'reviews', review.id);
      await updateDoc(reviewRef, {
        verifiedPurchase: !review.verifiedPurchase,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Verified Badge Updated",
        description: `Marked as ${!review.verifiedPurchase ? 'Verified Purchase' : 'Standard Review'}.`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update verified status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (review: ProductReview) => {
    if (!confirm(`Are you sure you want to permanently delete this review by ${review.userName}?`)) return;
    setIsProcessing(true);
    try {
      const reviewRef = doc(db, 'reviews', review.id);
      await deleteDoc(reviewRef);

      await syncProductRatingAndCount(review.productId);

      toast({
        title: "Review Deleted",
        description: "Review has been removed permanently.",
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete review",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Selection logic for bulk actions
  const toggleSelectAll = () => {
    if (selectedReviewIds.length === filteredReviews.length) {
      setSelectedReviewIds([]);
    } else {
      setSelectedReviewIds(filteredReviews.map(r => r.id));
    }
  };

  const toggleSelectReview = (id: string) => {
    if (selectedReviewIds.includes(id)) {
      setSelectedReviewIds(selectedReviewIds.filter(i => i !== id));
    } else {
      setSelectedReviewIds([...selectedReviewIds, id]);
    }
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (selectedReviewIds.length === 0) return;
    setIsProcessing(true);
    try {
      const affectedProducts = new Set<string>();
      
      for (const id of selectedReviewIds) {
        const rev = reviews.find(r => r.id === id);
        if (rev) {
          affectedProducts.add(rev.productId);
          const reviewRef = doc(db, 'reviews', id);
          await updateDoc(reviewRef, {
            status,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Sync product ratings
      for (const pid of affectedProducts) {
        await syncProductRatingAndCount(pid);
      }

      toast({
        title: `Bulk Action Complete`,
        description: `Updated ${selectedReviewIds.length} review(s) to ${status}.`,
      });

      setSelectedReviewIds([]);
    } catch (err: any) {
      toast({
        title: "Bulk Update Failed",
        description: err.message || "Could not update selected reviews",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (reviewsLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#7A6848] uppercase tracking-widest">Loading Moderation Desk...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-[#100C06]">Review Moderation</h1>
            {stats.pending > 0 && (
              <Badge className="bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-full animate-pulse">
                {stats.pending} Action Needed
              </Badge>
            )}
          </div>
          <p className="text-[#7A6848] text-sm mt-2 font-medium">
            Moderate, approve, or reject customer product reviews before they appear on the public storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              reviews.forEach(r => syncProductRatingAndCount(r.productId));
              toast({ title: "Product Ratings Synced", description: "Recalculated storefront stats for all reviewed products." });
            }}
            variant="outline" 
            className="h-11 px-5 rounded-xl border-[#DDD0B5] bg-white text-xs font-black uppercase tracking-wider hover:bg-[#F9F6EF]"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Product Stats
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <Card className="border-none shadow-md rounded-2xl bg-white p-5">
          <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-widest">Total Reviews</div>
          <div className="font-headline text-3xl font-extrabold text-primary mt-2">{stats.total}</div>
        </Card>

        <Card className="border-none shadow-md rounded-2xl bg-amber-500/10 border-amber-500/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-headline text-3xl font-extrabold text-amber-700 mt-2">{stats.pending}</div>
        </Card>

        <Card className="border-none shadow-md rounded-2xl bg-emerald-500/10 border-emerald-500/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Approved & Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-headline text-3xl font-extrabold text-emerald-700 mt-2">{stats.approved}</div>
        </Card>

        <Card className="border-none shadow-md rounded-2xl bg-rose-500/10 border-rose-500/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-headline text-3xl font-extrabold text-rose-700 mt-2">{stats.rejected}</div>
        </Card>

        <Card className="border-none shadow-md rounded-2xl bg-white p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#7A6848] uppercase tracking-widest">Avg Approved Rating</span>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="font-headline text-3xl font-extrabold text-primary mt-2">{stats.avgRating} ★</div>
        </Card>
      </div>

      {/* Controls Bar: Tabs, Search & Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EEE0BC]/40 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-[#F9F6EF] rounded-2xl w-fit">
            {[
              { id: 'all', label: 'All Reviews', count: stats.total },
              { id: 'pending', label: 'Pending', count: stats.pending, highlight: true },
              { id: 'approved', label: 'Approved', count: stats.approved },
              { id: 'rejected', label: 'Rejected', count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-md"
                    : "text-[#7A6848] hover:text-primary hover:bg-white/60"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px]",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-white text-primary"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input & Product Select */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                className="pl-10 h-10 rounded-xl bg-[#F9F6EF] border-transparent text-xs font-bold"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#F9F6EF] border-transparent text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Products</option>
              {rawProducts?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Operations Bar if any selected */}
        {selectedReviewIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-[#EBF5EE] rounded-2xl border border-primary/20 animate-in fade-in duration-200">
            <div className="text-xs font-bold text-primary flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>{selectedReviewIds.length} review(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('approved')}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Approve Selected
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkAction('rejected')}
                disabled={isProcessing}
                variant="destructive"
                className="rounded-xl text-xs font-bold"
              >
                Reject Selected
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedReviewIds([])}
                variant="ghost"
                className="text-xs font-bold text-[#7A6848]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card className="border-none shadow-sm rounded-3xl p-12 text-center bg-white">
          <MessageSquare className="w-12 h-12 text-[#DDD0B5] mx-auto mb-3" />
          <h3 className="font-headline text-2xl font-bold text-primary mb-1">No Reviews Found</h3>
          <p className="text-xs text-[#7A6848]">
            {searchQuery || activeTab !== 'all' || selectedProductId !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Submitted customer reviews will appear here for administrative moderation.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-[#7A6848]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedReviewIds.length === filteredReviews.length && filteredReviews.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
              />
              <span>Select All Shown ({filteredReviews.length})</span>
            </label>
            <span>Showing {filteredReviews.length} of {reviews.length} total reviews</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((review) => {
              const isSelected = selectedReviewIds.includes(review.id);
              return (
                <Card 
                  key={review.id}
                  className={cn(
                    "border border-[#EEE0BC]/60 rounded-3xl bg-white shadow-sm hover:shadow-md transition-all overflow-hidden",
                    review.status === 'pending' && "border-l-4 border-l-amber-500 bg-amber-500/[0.02]",
                    review.status === 'rejected' && "opacity-80 border-l-4 border-l-rose-500",
                    review.status === 'approved' && "border-l-4 border-l-emerald-500",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      
                      {/* Left Block: Checkbox, Product & Customer details */}
                      <div className="flex items-start gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectReview(review.id)}
                          className="mt-1 rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 shrink-0"
                        />

                        {/* Product Thumbnail */}
                        <div className="w-14 h-14 bg-[#F9F6EF] rounded-2xl relative overflow-hidden shrink-0 border border-[#EEE0BC]/40 flex items-center justify-center">
                          {review.productImage ? (
                            <Image src={review.productImage} alt={review.productName || 'Product'} fill className="object-cover" />
                          ) : (
                            <span className="text-2xl">🧈</span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Product link & Status Badge */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/product/${review.productId}`} target="_blank" className="text-xs font-black text-primary hover:underline truncate">
                              {review.productName}
                            </Link>
                            
                            {/* Status Indicator */}
                            {review.status === 'pending' && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending Moderation
                              </Badge>
                            )}
                            {review.status === 'approved' && (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                              </Badge>
                            )}
                            {review.status === 'rejected' && (
                              <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-300">
                                <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                              </Badge>
                            )}

                            {/* Verified Purchase Toggle */}
                            <button
                              onClick={() => handleToggleVerified(review)}
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-1",
                                review.verifiedPurchase
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              )}
                              title="Click to toggle verified purchase badge"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {review.verifiedPurchase ? "Verified Buyer" : "Unverified"}
                            </button>
                          </div>

                          {/* Customer Info */}
                          <div className="flex items-center gap-2 text-xs font-bold text-[#100C06]">
                            <span>{review.userName}</span>
                            {review.userEmail && <span className="text-[#7A6848] font-medium text-[11px]">({review.userEmail})</span>}
                            <span className="text-muted-foreground text-[10px]">· {format(new Date(review.createdAt), 'MMM d, yyyy h:mm a')}</span>
                          </div>

                          {/* Rating & Review Content */}
                          <div className="pt-2">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn("w-4 h-4", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100")} 
                                />
                              ))}
                              <span className="text-xs font-black text-primary ml-1">{review.rating}.0/5</span>
                            </div>

                            <h4 className="text-sm font-black text-primary mb-1">{review.title}</h4>
                            <p className="text-xs text-[#7A6848] font-medium leading-relaxed bg-[#F9F6EF] p-3 rounded-2xl border border-[#EEE0BC]/30">
                              &quot;{review.comment}&quot;
                            </p>

                            {/* Attached Customer Photos */}
                            {review.images && review.images.length > 0 && (
                              <div className="pt-2">
                                <span className="text-[10px] font-black uppercase text-[#7A6848] tracking-wider block mb-1">
                                  Customer Photos ({review.images.length}):
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {review.images.map((imgUrl, imgIdx) => (
                                    <a
                                      key={imgIdx}
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-14 h-14 rounded-xl overflow-hidden border border-[#DDD0B5] block relative group hover:ring-2 hover:ring-primary/40 transition-all bg-white shrink-0"
                                    >
                                      {/* eslint-disable-next-html-element-for-a11y */}
                                      <img src={imgUrl} alt={`Customer photo ${imgIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Comment if any */}
                            {review.adminComment && (
                              <div className="mt-2 text-xs bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl font-medium flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Admin Note:</span> {review.adminComment}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 border-t lg:border-t-0 lg:border-l border-[#EEE0BC]/40 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                        {review.status !== 'approved' && (
                          <Button
                            onClick={() => handleApprove(review)}
                            disabled={isProcessing}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold w-full lg:w-32"
                          >
                            <Check className="w-4 h-4 mr-1.5" /> Approve
                          </Button>
                        )}

                        {review.status !== 'rejected' && (
                          <Button
                            onClick={() => openRejectModal(review)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold w-full lg:w-32"
                          >
                            <X className="w-4 h-4 mr-1.5" /> Reject
                          </Button>
                        )}

                        {review.status !== 'pending' && (
                          <Button
                            onClick={() => handleResetPending(review)}
                            disabled={isProcessing}
                            variant="ghost"
                            size="sm"
                            className="text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-bold w-full lg:w-32"
                          >
                            <Clock className="w-3.5 h-3.5 mr-1.5" /> Reset Pending
                          </Button>
                        )}

                        <Button
                          onClick={() => handleDelete(review)}
                          disabled={isProcessing}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-rose-600 rounded-xl text-xs font-bold"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-extrabold text-primary">Reject Customer Review</DialogTitle>
            <DialogDescription className="text-xs text-[#7A6848]">
              Optionally specify a reason for rejecting this review. If provided, this feedback will be visible to the customer when viewing their review history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#7A6848] mb-1 block">Rejection Reason / Note</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Review contains inappropriate language, off-topic spam, or unverified claims..."
                className="rounded-xl bg-[#F9F6EF] border-transparent text-xs font-medium min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isProcessing}
              className="rounded-xl text-xs font-bold"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
