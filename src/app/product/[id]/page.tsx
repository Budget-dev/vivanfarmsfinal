"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Image from 'next/image';
import { 
  ChevronRight,
  X,
  ChevronLeft
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Product, ProductVariant } from '@/types';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { ProductReviewsSection } from '@/components/vivaan/ProductReviewsSection';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchasePane } from '@/components/product/ProductPurchasePane';
import { PurityGuaranteeSection } from '@/components/product/PurityGuaranteeSection';
import { ComparisonSection } from '@/components/product/ComparisonSection';
import { FarmJourneySection } from '@/components/product/FarmJourneySection';
import { ProductFaqSection } from '@/components/product/ProductFaqSection';
import { StickyMobileBar } from '@/components/product/StickyMobileBar';
import { ProductInstagramReelSection } from '@/components/product/ProductInstagramReelSection';
import { cn } from '@/lib/utils';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  // Firestore Live Query for real-time document
  const productRef = useMemoFirebase(() => id ? doc(db, 'products', id as string) : null, [db, id]);
  const { data: dbProduct, isLoading } = useDoc(productRef);
  
  // Cart & Wishlist hooks
  const { cart, addToCart, setBuyNowItem, updateQty, removeFromCart, totalQty } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Resolve pure Firestore product data
  const product: Product | null = useMemo(() => {
    if (!dbProduct) return null;

    const basePrice = Number(dbProduct.basePrice) || Number(dbProduct.price) || 0;
    const mrpPrice = Number(dbProduct.mrpPrice) || basePrice;
    const cat = (dbProduct.categoryId || dbProduct.cat || 'products').toLowerCase();

    const rawVars: ProductVariant[] = Array.isArray(dbProduct.vars) && dbProduct.vars.length > 0
      ? dbProduct.vars
      : [{
          s: dbProduct.vol || (dbProduct.volumeValue ? `${dbProduct.volumeValue}${dbProduct.volumeUnit || ''}` : 'Standard'),
          p: basePrice,
          mrp: mrpPrice,
          on: true
        }];

    const imageUrls: string[] = Array.isArray(dbProduct.imageUrls) && dbProduct.imageUrls.length > 0
      ? dbProduct.imageUrls.filter(Boolean)
      : ['/images/products/ghee_tin.jpg'];

    return {
      ...dbProduct,
      id: dbProduct.id || (id as string),
      name: dbProduct.name || dbProduct.title || 'Product',
      title: dbProduct.title || dbProduct.name || 'Product',
      cat: cat,
      price: basePrice,
      mrpPrice: mrpPrice,
      stock: dbProduct.stockQuantity !== undefined ? Number(dbProduct.stockQuantity) : (dbProduct.stock !== undefined ? Number(dbProduct.stock) : 50),
      purityCoins: dbProduct.purityCoins ? Number(dbProduct.purityCoins) : Math.round(basePrice * 0.1),
      rating: Number(dbProduct.rating) || 4.9,
      reviewCount: Number(dbProduct.reviewCount) || 120,
      soldCountLabel: dbProduct.soldCountLabel || 'Pure & Natural',
      statusBadge: dbProduct.statusBadge || 'Farm Fresh',
      vol: dbProduct.vol || rawVars[0]?.s || 'Standard',
      vars: rawVars,
      imageUrls: imageUrls,
      reels: Array.isArray(dbProduct.reels) ? dbProduct.reels : [],
      videoUrl: dbProduct.videoUrl || (dbProduct.reels?.[0]?.videoUrl || ''),
      badges: Array.isArray(dbProduct.badges) ? dbProduct.badges : [],
      description: dbProduct.description || '',
      ingredients: Array.isArray(dbProduct.ingredients) ? dbProduct.ingredients : (dbProduct.ingredients ? [dbProduct.ingredients] : []),
      benefits: Array.isArray(dbProduct.benefits) ? dbProduct.benefits : (dbProduct.benefits ? [dbProduct.benefits] : []),
      howMade: dbProduct.howMade || '',
      cookingCare: dbProduct.cookingCare || '',
      isLive: dbProduct.isLive !== false,
    } as any;
  }, [dbProduct, id]);

  // Interactive States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('Standard');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Synchronize default variant and images when product loads or updates
  useEffect(() => {
    if (product && product.vars && product.vars.length > 0) {
      const matchExisting = product.vars.find((v: ProductVariant) => v.s === selectedSize);
      if (!matchExisting) {
        const defaultVar = product.vars.find((v: ProductVariant) => v.on) || product.vars[0];
        if (defaultVar) {
          setSelectedSize(defaultVar.s);
        }
      }
    }
  }, [product, selectedSize]);

  // Active Variant & Pricing Calculations
  const getVariantPrice = (v?: ProductVariant): number => {
    if (!product) return 0;
    if (!v) return product.price > 0 ? product.price : ((product as any).basePrice || 0);
    const vp = Number(v.p);
    if (vp > 0) return vp;
    const legacyPrice = Number((v as any).price);
    if (legacyPrice > 0) return legacyPrice;
    if (product.price > 0) return product.price;
    if ((product as any).basePrice && (product as any).basePrice > 0) return (product as any).basePrice;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#0D3B2E]/20 border-t-[#0D3B2E] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#0D3B2E] tracking-wider uppercase">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#0D3B2E] mb-2">Product Not Found</h2>
        <p className="text-sm text-gray-600 mb-6">The product you are looking for does not exist or is currently unavailable.</p>
        <button
          onClick={() => router.push('/category/all')}
          className="px-6 py-2.5 bg-[#0D3B2E] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#124e3f] transition-all cursor-pointer"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  const currentVar: ProductVariant = (product.vars && product.vars.find((v: ProductVariant) => v.s === selectedSize)) || (product.vars && product.vars[0]) || { s: 'Standard', p: product.price, on: true };
  const displayPrice = getVariantPrice(currentVar);
  const isWishlisted = isInWishlist(product.id);
  const galleryImages = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls : ['/images/products/ghee_tin.jpg'];
  const activeImageSrc = galleryImages[selectedImgIndex] || galleryImages[0];

  // Cart quantity count for this specific product & size
  const normalizeSize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const selectedNorm = normalizeSize(selectedSize);

  const cartItem = cart.find(c => {
    if (c.id !== product.id) return false;
    if (!c.vol || !selectedSize) return true;
    return normalizeSize(c.vol) === selectedNorm;
  }) || cart.find(c => c.id === product.id);

  const cartCountForThisProduct = cartItem ? cartItem.qty : 0;

  const handleUpdateCartQty = (delta: number) => {
    if (!cartItem) {
      if (delta > 0) handleAddToCart();
      return;
    }
    const newQty = cartItem.qty + delta;
    if (newQty <= 0) {
      removeFromCart(cartItem.id, cartItem.vol);
    } else {
      updateQty(cartItem.id, cartItem.vol, delta);
    }
  };

  // Add to Cart handler
  const handleAddToCart = () => {
    addToCart({ 
      ...product, 
      price: displayPrice, 
      vol: selectedSize,
      imageUrls: galleryImages 
    } as any, qty);
    setIsCartOpen(true);
  };

  // Buy Now handler: cleanly sets product & variant in cart without adding unwanted duplicates on retry
  const handleBuyNow = () => {
    setBuyNowItem({ 
      ...product, 
      price: displayPrice, 
      vol: selectedSize,
      imageUrls: galleryImages 
    } as any, qty);
    router.push('/checkout');
  };

  // Share handler
  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-900 pb-28 md:pb-0 font-sans">
      
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <Ticker />

      {/* 2. HEADER */}
      <Header 
        onOpenCart={() => setIsCartOpen(true)} 
        cartCount={totalQty}
        onFilter={() => router.push('/')}
        onSearch={() => router.push('/')}
      />

      {/* 3. MAIN PRODUCT SHOWCASE CONTAINER */}
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8"
      >
        
        {/* Dynamic Category Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap no-scrollbar">
          <span className="cursor-pointer hover:text-[#0D3B2E] transition-colors" onClick={() => router.push('/')}>
            Home
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="cursor-pointer hover:text-[#0D3B2E] transition-colors uppercase" onClick={() => router.push(`/category/${product.cat}`)}>
            {product.cat}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[#0D3B2E] font-extrabold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Product Showcase (Gallery & Purchase Pane) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
          
          {/* Left Column: Image Gallery (Hero + 2-Column Infographic Grid) */}
          <div className="md:col-span-7">
            <ProductGallery 
              images={galleryImages}
              activeImageIndex={selectedImgIndex}
              onSelectImage={setSelectedImgIndex}
              productName={product.name}
              isWishlisted={isWishlisted}
              onToggleWishlist={() => toggleWishlist(product.id)}
              onShare={handleShare}
              onOpenLightbox={() => setIsLightboxOpen(true)}
              category={product.cat}
              price={displayPrice}
              onAddToCart={handleAddToCart}
            />
          </div>

          {/* Right Column: Purchasing Pane (Sticky on Desktop) */}
          <div className="md:col-span-5 md:sticky md:top-24 self-start">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#E9DFCF] shadow-xs">
              <ProductPurchasePane 
                product={product}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                qty={qty}
                onQtyChange={setQty}
                cartCountForThisProduct={cartCountForThisProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onOpenCart={() => setIsCartOpen(true)}
              />
            </div>
          </div>

        </div>

      </motion.main>

      {/* 4. 9:16 INSTAGRAM REELS & BEHIND-THE-SCENES VIDEO */}
      <ProductInstagramReelSection 
        product={product} 
        onAddToCart={handleAddToCart} 
      />

      {/* 5. SECTION: How Do You Know It’s Safe & Pure? */}
      <PurityGuaranteeSection />

      {/* 5. SECTION: What Makes Us Different? */}
      <ComparisonSection />

      {/* 6. SECTION: From Our Farmers’ To Your Kitchen (In Just 14 Days) */}
      <FarmJourneySection />

      {/* 7. SECTION: Customer Reviews */}
      <ProductReviewsSection 
        productId={product.id} 
        productName={product.name} 
        productImage={galleryImages[0]} 
        fallbackRating={product.rating} 
        fallbackCount={product.reviewCount} 
      />

      {/* 8. SECTION: FAQs */}
      <ProductFaqSection />

      {/* 9. STICKY MOBILE BOTTOM BAR & FLOATING WHATSAPP */}
      <StickyMobileBar 
        productName={product.name}
        thumbnailUrl={galleryImages[0]}
        selectedSize={selectedSize}
        qty={qty}
        pricePerUnit={displayPrice}
        cartCount={cartCountForThisProduct}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onUpdateCartQty={handleUpdateCartQty}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 10. FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close image modal"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImgIndex((selectedImgIndex - 1 + galleryImages.length) % galleryImages.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImgIndex((selectedImgIndex + 1) % galleryImages.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {/* Main Large Image */}
          <div 
            className="relative w-full max-w-4xl h-[70vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {activeImageSrc && (
              <Image 
                src={activeImageSrc} 
                alt={product.name} 
                fill 
                className="object-contain drop-shadow-2xl select-none" 
              />
            )}
          </div>

          {/* Thumbnails strip */}
          <div 
            className="flex gap-2 mt-4 overflow-x-auto max-w-full px-4 no-scrollbar z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {galleryImages.map((img, i) => (
              <button 
                key={i} 
                type="button"
                onClick={() => setSelectedImgIndex(i)}
                className={cn(
                  "w-14 h-14 rounded-xl border-2 overflow-hidden relative transition-all cursor-pointer shadow-md",
                  selectedImgIndex === i ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                )}
                aria-label={`Thumbnail ${i + 1}`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 11. FOOTER */}
      <Footer />
      
      {/* 12. CART SIDEBAR */}
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => { setIsCartOpen(false); router.push('/checkout'); }}
      />
    </div>
  );
}
