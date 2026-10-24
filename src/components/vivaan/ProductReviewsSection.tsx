"use client";

import React, { useState, useMemo, useRef } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PenSquare, 
  ShieldCheck, 
  MessageSquare,
  AlertCircle,
  Sparkles,
  ChevronDown,
  X,
  Filter,
  Camera,
  ImageIcon,
  Plus,
  Trash2,
  ZoomIn,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { ProductReview, ReviewStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from './LoginModal';
import { cn } from '@/lib/utils';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { format } from 'date-fns';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productImage?: string;
  fallbackRating?: number;
  fallbackCount?: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  productImage,
  fallbackRating = 0,
  fallbackCount = 0,
}) => {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Firestore query for reviews for this product
  const reviewsRef = useMemoFirebase(
    () => collection(db, 'reviews'),
    [db]
  );
  const { data: rawReviews, isLoading: reviewsLoading, error: reviewsError } = useCollection(reviewsRef);

  // Modal and Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo upload states & refs
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Lightbox preview state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form fields
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Sorting & Filtering
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');

  // Helper to compress and convert file to lightweight Base64 string
  const compressAndConvertImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to parse image file'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo Files Selection / Camera Capture
  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length >= 4) {
      toast({
        title: "Photo Limit Reached",
        description: "You can attach up to 4 photos per review.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPhotos(true);
    try {
      const newImages: string[] = [];
      const remainingSlots = 4 - attachedImages.length;
      const processCount = Math.min(files.length, remainingSlots);

      for (let i = 0; i < processCount; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressAndConvertImage(file);
        newImages.push(compressed);
      }

      if (newImages.length > 0) {
        setAttachedImages(prev => [...prev, ...newImages]);
        toast({
          title: "Photos Attached ✦",
          description: `Added ${newImages.length} photo${newImages.length > 1 ? 's' : ''} to your review.`,
        });
      }
    } catch (err: any) {
      console.error("Error processing photos:", err);
      toast({
        title: "Image Upload Error",
        description: "Failed to process photo. Please try a different image.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPhotos(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Process and group reviews
  const allProductReviews: ProductReview[] = useMemo(() => {
    if (!rawReviews) return [];
    return rawReviews
      .filter((r: any) => r.productId === productId)
      .map((r: any) => ({
        id: r.id,
        productId: r.productId,
        productName: r.productName,
        productImage: r.productImage,
        userId: r.userId,
        userName: r.userName || 'Verified Buyer',
        userEmail: r.userEmail || '',
        rating: Number(r.rating) || 5,
        title: r.title || '',
        comment: r.comment || '',
        images: Array.isArray(r.images) ? r.images : (Array.isArray(r.imageUrls) ? r.imageUrls : []),
        status: (r.status as ReviewStatus) || 'pending',
        adminComment: r.adminComment || '',
        isVerified: Boolean(r.isVerified),
        verifiedPurchase: Boolean(r.verifiedPurchase),
        helpfulCount: Number(r.helpfulCount) || 0,
        helpfulUsers: Array.isArray(r.helpfulUsers) ? r.helpfulUsers : [],
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt,
      }));
  }, [rawReviews, productId]);

  // Approved public reviews
  const approvedReviews = useMemo(() => {
    return allProductReviews.filter(r => r.status === 'approved');
  }, [allProductReviews]);

  // User's own review (if logged in)
  const myReview = useMemo(() => {
    if (!user) return null;
    return allProductReviews.find(r => r.userId === user.uid) || null;
  }, [allProductReviews, user]);

  // Public statistics
  const stats = useMemo(() => {
    const totalCount = approvedReviews.length;
    if (totalCount === 0) {
      return {
        avgRating: 0,
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = approvedReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = Number((sum / totalCount).toFixed(1));

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    approvedReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    [5, 4, 3, 2, 1].forEach(star => {
      distribution[star] = Math.round((counts[star] / totalCount) * 100);
    });

    return {
      avgRating: avg,
      totalCount: totalCount,
      distribution
    };
  }, [approvedReviews, fallbackRating, fallbackCount]);

  // Filter & sort public reviews
  const displayedReviews = useMemo(() => {
    let list = [...approvedReviews];

    // Filter by star
    if (selectedStarFilter !== 'all') {
      list = list.filter(r => Math.round(r.rating) === selectedStarFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else if (sortBy === 'lowest') {
        return a.rating - b.rating;
      } else if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      return 0;
    });

    return list;
  }, [approvedReviews, selectedStarFilter, sortBy]);

  // Open Form Handler
  const handleOpenForm = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (myReview) {
      setRating(myReview.rating);
      setTitle(myReview.title);
      setComment(myReview.comment);
      setAttachedImages(myReview.images || []);
    } else {
      setRating(5);
      setTitle('');
      setComment('');
      setAttachedImages([]);
    }

    setIsFormOpen(true);
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast({
        title: "Incomplete Review",
        description: "Please provide both a title and review feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewId = myReview ? myReview.id : `${productId}_${user.uid}`;
      const reviewDocRef = doc(db, 'reviews', reviewId);

      const reviewData = {
        id: reviewId,
        productId,
        productName,
        productImage: productImage || '',
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Vivan Customer',
        userEmail: user.email || '',
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        images: attachedImages,
        status: 'pending', // ALWAYS enters as pending for admin moderation!
        adminComment: '',
        isVerified: false,
        verifiedPurchase: false,
        helpfulCount: 0,
        helpfulUsers: [],
        createdAt: myReview?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(reviewDocRef, reviewData, { merge: true });

      toast({
        title: "Review Submitted for Moderation ✦",
        description: "Thank you! Your review has been submitted and will appear on the storefront once approved by our administrators.",
      });

      setIsFormOpen(false);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast({
        title: "Submission Error",
        description: err.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpful Vote Handler
  const handleHelpfulClick = async (review: ProductReview) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const currentHelpfulUsers = review.helpfulUsers || [];
    if (currentHelpfulUsers.includes(user.uid)) {
      toast({
        title: "Feedback Recorded",
        description: "You have already marked this review as helpful.",
      });
      return;
    }

    try {
      const newHelpfulUsers = [...currentHelpfulUsers, user.uid];
      const newCount = (review.helpfulCount || 0) + 1;

      const reviewDocRef = doc(db, 'reviews', review.id);
      await updateDoc(reviewDocRef, {
        helpfulCount: newCount,
        helpfulUsers: newHelpfulUsers
      });

      toast({
        title: "Thank You!",
        description: "Your vote has been counted.",
      });
    } catch (e) {
      console.error("Error updating helpful vote", e);
    }
  };

  const getRatingLabel = (num: number) => {
    switch (num) {
      case 5: return "5.0 - Excellent!";
      case 4: return "4.0 - Very Good";
      case 3: return "3.0 - Average";
      case 2: return "2.0 - Below Expectations";
      case 1: return "1.0 - Poor";
      default: return "";
    }
  };

  return (
    <section className="py-16 md:py-24 border-t border-[#EEE0BC]/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-[3px] mb-2">Verified Customer Feedback</div>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#E76F51]">Customer Reviews</h2>
          </div>

          <Button
            onClick={handleOpenForm}
            className="h-12 px-6 bg-primary text-white hover:bg-secondary rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg flex items-center gap-2 group shrink-0"
          >
            <PenSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
            {myReview ? "Edit My Review" : "Write a Review"}
          </Button>
        </div>

        {/* User's Own Submitted Review Status Banner (if exists) */}
        {myReview && (
          <div className="mb-12 bg-white rounded-3xl p-6 md:p-8 border border-[#EEE0BC] shadow-md relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#7A6848]">Your Submitted Review</span>
                  
                  {myReview.status === 'pending' && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Pending Admin Moderation
                    </Badge>
                  )}
                  {myReview.status === 'approved' && (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published & Live
                    </Badge>
                  )}
                  {myReview.status === 'rejected' && (
                    <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-rose-300">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Not Approved
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-4 h-4", i < myReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100")} />
                    ))}
                  </div>
                  <span className="font-bold text-sm text-primary">{myReview.title}</span>
                </div>

                <p className="text-xs text-[#7A6848] font-medium italic bg-[#F9F6EF] p-3 rounded-xl">
                  &quot;{myReview.comment}&quot;
                </p>

                {/* Attached Review Images in Submitted Banner */}
                {myReview.images && myReview.images.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase text-[#7A6848] tracking-wider block mb-1.5">
                      Attached Photos ({myReview.images.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {myReview.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxImage(imgUrl)}
                          className="w-14 h-14 rounded-xl overflow-hidden relative border border-[#EEE0BC] group shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                        >
                          {/* eslint-disable-next-html-element-for-a11y */}
                          <img src={imgUrl} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {myReview.status === 'pending' && (
                  <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5 mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Your review is currently in our moderation queue and will be published publicly once approved by administrators.
                  </p>
                )}

                {myReview.status === 'rejected' && myReview.adminComment && (
                  <p className="text-[11px] text-rose-800 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-2">
                    <span className="font-bold">Admin Feedback:</span> {myReview.adminComment}
                  </p>
                )}
              </div>

              <Button
                onClick={handleOpenForm}
                variant="outline"
                className="h-10 px-5 rounded-xl border-primary text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-wider shrink-0"
              >
                Update Review
              </Button>
            </div>
          </div>
        )}

        {/* Main Review Grid & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Stats Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-[#EEE0BC]/60 shadow-sm">
              <div className="text-center mb-6">
                <div className="font-headline text-6xl font-black text-primary">{stats.avgRating}</div>
                <div className="flex justify-center gap-1 my-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-5 h-5", i < Math.round(stats.avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100")} />
                  ))}
                </div>
                <div className="text-xs font-bold text-[#7A6848] uppercase tracking-wider">
                  Based on {stats.totalCount} verified reviews
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-3 pt-4 border-t border-[#EEE0BC]/40">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = stats.distribution[star as keyof typeof stats.distribution] || 0;
                  return (
                    <button
                      key={star}
                      onClick={() => setSelectedStarFilter(selectedStarFilter === star ? 'all' : star)}
                      className={cn(
                        "w-full flex items-center gap-3 text-xs font-bold py-1 px-2 rounded-xl transition-colors hover:bg-[#F9F6EF]",
                        selectedStarFilter === star && "bg-[#EBF5EE] text-primary"
                      )}
                    >
                      <span className="w-6 text-right font-black">{star} ★</span>
                      <div className="flex-1 h-2 bg-[#F9F6EF] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] text-[#7A6848] font-medium">{pct}%</span>
                    </button>
                  );
                })}
              </div>

              {selectedStarFilter !== 'all' && (
                <button
                  onClick={() => setSelectedStarFilter('all')}
                  className="w-full mt-4 py-2 text-xs font-bold text-primary hover:underline text-center"
                >
                  Show All Rating Stars
                </button>
              )}
            </div>

            {/* Guarantee Callout */}
            <div className="bg-[#EBF5EE] p-6 rounded-3xl border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> 100% Moderated Reviews
              </div>
              <p className="text-xs text-[#7A6848] leading-relaxed">
                We verify every customer review to prevent fake spam and ensure authentic feedback from genuine Gir A2 buyers.
              </p>
            </div>
          </div>

          {/* Review List Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Filter and Sorting Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EEE0BC]/40">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7A6848]">
                <Filter className="w-4 h-4 text-primary" />
                <span>Filter:</span>
                <span className="text-primary font-black uppercase">
                  {selectedStarFilter === 'all' ? 'All Stars' : `${selectedStarFilter} Stars Only`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7A6848]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#F9F6EF] border-transparent text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="newest">Most Recent</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>

            {reviewsError && (
              <div className="mb-6">
                <ErrorCard
                  error={reviewsError}
                  compact
                  title="Customer Reviews Notice"
                  message="We're currently unable to load live customer reviews from the database."
                />
              </div>
            )}

            {/* Display Approved Reviews */}
            {displayedReviews.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EEE0BC]/40">
                <MessageSquare className="w-10 h-10 text-[#DDD0B5] mx-auto mb-3" />
                <h3 className="font-headline text-2xl font-bold text-primary mb-1">No Approved Reviews Yet</h3>
                <p className="text-xs text-[#7A6848] max-w-md mx-auto mb-6">
                  {selectedStarFilter !== 'all'
                    ? `No ${selectedStarFilter}-star reviews found. Try clearing the filter.`
                    : 'Be the first customer to submit a review for this product!'}
                </p>
                <Button
                  onClick={handleOpenForm}
                  className="bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Write First Review
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedReviews.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="bg-white p-6 md:p-8 rounded-3xl border border-[#EEE0BC]/40 shadow-xs hover:shadow-sm transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F1EAD8] flex items-center justify-center font-black text-primary text-sm shrink-0">
                          {rev.userName ? rev.userName[0].toUpperCase() : 'V'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primary">{rev.userName}</span>
                            {rev.isVerified && (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-bold text-[9px] px-2 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified Buyer
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star 
                                key={j} 
                                className={cn("w-3 h-3", j < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100")} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#7A6848]/60 uppercase tracking-wider shrink-0">
                        {format(new Date(rev.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-primary mb-1">{rev.title}</h4>
                      <p className="text-xs text-[#7A6848] leading-relaxed font-medium">{rev.comment}</p>
                    </div>

                    {/* Customer Attached Photos */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-2.5">
                          {rev.images.map((img, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => setLightboxImage(img)}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden relative border border-[#EEE0BC] group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all bg-[#F9F6EF]"
                            >
                              {/* eslint-disable-next-html-element-for-a11y */}
                              <img 
                                src={img} 
                                alt={`${rev.userName} review photo ${imgIdx + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#EEE0BC]/20 text-xs">
                      <button
                        onClick={() => handleHelpfulClick(rev)}
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-bold transition-all px-3 py-1.5 rounded-xl",
                          rev.helpfulUsers?.includes(user?.uid || '')
                            ? "bg-primary/10 text-primary"
                            : "text-[#7A6848] hover:bg-[#F9F6EF] hover:text-primary"
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful ({rev.helpfulCount || 0})</span>
                      </button>

                      <span className="text-[10px] font-bold text-[#7A6848]/40 uppercase tracking-widest">Vivan Verified Review</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write/Edit Review Modal Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-3xl max-w-lg p-6 md:p-8 bg-white border border-[#EEE0BC]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-extrabold text-primary">
              {myReview ? "Edit Your Product Review" : "Write a Customer Review"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7A6848]">
              Share your genuine feedback for <span className="font-bold text-primary">{productName}</span>. Your review will be moderated before publication.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-6 my-2">
            
            {/* Interactive Rating Selector */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-primary block mb-2">Overall Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        "w-8 h-8 transition-colors",
                        (hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100"
                      )} 
                    />
                  </button>
                ))}
                <span className="ml-3 text-xs font-bold text-primary">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-primary block mb-1">Review Headline</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Delicious authentic aroma & texture!"
                required
                className="h-12 rounded-xl bg-[#F9F6EF] border-transparent text-xs font-bold px-4"
              />
            </div>

            {/* Feedback Body */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-primary block mb-1">Detailed Feedback</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love about the product? How do you use it in your meals?"
                rows={4}
                required
                className="rounded-xl bg-[#F9F6EF] border-transparent text-xs font-medium p-4 min-h-[120px]"
              />
            </div>

            {/* Photo Attachments (Camera or Gallery) */}
            <div className="bg-[#FAF8F3] p-4 rounded-2xl border border-[#EEE0BC]/70 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-primary" />
                  Attach Photos (Optional)
                </label>
                <span className="text-[11px] font-bold text-[#7A6848]">
                  {attachedImages.length}/4 attached
                </span>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageFilesSelected}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageFilesSelected}
              />

              {/* Upload Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessingPhotos || attachedImages.length >= 4}
                  variant="outline"
                  className="h-10 px-3.5 rounded-xl border-[#DDD0B5] bg-white hover:bg-[#F1EAD8] text-primary text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors active:scale-95"
                >
                  <Camera className="w-4 h-4 text-primary" />
                  Take Photo (Camera)
                </Button>

                <Button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessingPhotos || attachedImages.length >= 4}
                  variant="outline"
                  className="h-10 px-3.5 rounded-xl border-[#DDD0B5] bg-white hover:bg-[#F1EAD8] text-primary text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Upload from Gallery
                </Button>
              </div>

              {/* Processing Loader */}
              {isProcessingPhotos && (
                <div className="flex items-center gap-2 py-1 text-xs text-primary font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing image quality...
                </div>
              )}

              {/* Preview thumbnails */}
              {attachedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {attachedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#DDD0B5] group bg-white shadow-xs">
                      {/* eslint-disable-next-html-element-for-a11y */}
                      <img src={img} alt={`Attached preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="bg-[#EBF5EE] p-4 rounded-2xl border border-primary/10 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#7A6848] font-medium leading-normal">
                To keep Vivan Farms feedback trusted and authentic, all customer reviews undergo administrative moderation prior to appearing publicly on product pages.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl text-xs font-bold h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white rounded-xl text-xs font-bold h-11 px-6 uppercase tracking-wider shadow-md"
              >
                {isSubmitting ? "Submitting..." : myReview ? "Update Review" : "Submit Review"}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Photo Lightbox Preview Modal */}
      <Dialog open={Boolean(lightboxImage)} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-3xl p-3 bg-black/95 border-none rounded-3xl overflow-hidden flex flex-col items-center justify-center">
          <div className="relative w-full max-h-[80vh] flex items-center justify-center p-2">
            {lightboxImage && (
              /* eslint-disable-next-html-element-for-a11y */
              <img 
                src={lightboxImage} 
                alt="Full customer review photo" 
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl" 
              />
            )}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
