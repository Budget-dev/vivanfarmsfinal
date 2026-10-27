import { ReactNode } from 'react';

// Re-export all v2 product types
export * from './product';

export type Category = 'all' | 'ghee' | 'sweets' | 'honey' | 'superfoods';

export interface ProductVariant {
  s: string; // size or weight (e.g. 250g, 500g, 1kg, 2kg)
  p: number; // selling price
  mrp?: number; // MRP original price
  stock?: number; // available stock for this variant
  on?: boolean; // default selected
}

export interface ProductReel {
  id: string;
  title: string;
  subtitle?: string;
  videoUrl: string;
  posterUrl?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsLabel?: string;
  tag?: string;
}

export interface Product {
  id: string;
  name: string;
  vol: string;
  price: number;
  basePrice?: number;
  mrpPrice?: number;
  off?: string;
  rating: number;
  reviewCount: number;
  purityCoins: number; // For compatibility
  rewardCoins?: number; // Real admin defined reward
  productCoupon?: string; // Product-specific coupon
  soldCountLabel: string; // e.g., "1.5k+"
  statusBadge?: string; // e.g., "Selling Fast"
  rat?: number; // legacy alias for rating
  revs?: number; // legacy alias for reviewCount
  sold?: string; // legacy alias for soldCountLabel
  mrp?: number; // legacy alias for mrpPrice
  cat: string;
  categoryId?: string;
  stock: number;
  badges: string[];
  pi?: number; // placeholder index
  vars: ProductVariant[];
  description?: string;
  imageUrls?: string[];
  videoUrl?: string;
  ingredients?: string[];
  benefits?: string[];
  reels?: ProductReel[];
  howMade?: string;
  cookingCare?: string;
  isLive?: boolean;
  stockQuantity?: number;
}

export interface UniversalCoupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  purityCoins: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  adminComment?: string;
  verifiedPurchase?: boolean;
  isVerified?: boolean;
  helpfulCount?: number;
  helpfulUsers?: string[];
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}
