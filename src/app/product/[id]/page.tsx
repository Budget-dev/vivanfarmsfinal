"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronRight,
  X,
  ChevronLeft
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Product, ProductVariant } from '@/types';
import { getProductById } from '@/lib/catalog';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { ProductReviewsSection } from '@/components/vivaan/ProductReviewsSection';
import { ProductGallery, BUFFALO_GHEE_IMAGES } from '@/components/product/ProductGallery';
import { ProductPurchasePane, VIVAAN_BUFFALO_VARIANTS } from '@/components/product/ProductPurchasePane';
import { PurityGuaranteeSection } from '@/components/product/PurityGuaranteeSection';
import { ComparisonSection } from '@/components/product/ComparisonSection';
import { FarmJourneySection } from '@/components/product/FarmJourneySection';
import { ProductFaqSection } from '@/components/product/ProductFaqSection';
import { StickyMobileBar } from '@/components/product/StickyMobileBar';
import { ProductInstagramReelSection } from '@/components/product/ProductInstagramReelSection';
import { cn } from '@/lib/utils';

export const DEFAULT_BUFFALO_GHEE_PRODUCT: Product = {
  id: 'a2-desi-buffalo-ghee',
  name: 'A2 Desi Buffalo Ghee',
  cat: 'ghee',
  price: 1099,
  mrpPrice: 1299,
  stock: 50,
  purityCoins: 110,
  rating: 4.9,
  reviewCount: 1420,
  soldCountLabel: '12.4k+ delivered',
  statusBadge: 'Creamy',
  vol: '500mL Glass Jar',
  vars: VIVAAN_BUFFALO_VARIANTS,
  imageUrls: BUFFALO_GHEE_IMAGES,
  badges: ['Creamy', '100% Vedic Bilona', 'Double Lab Tested'],
  description: 'Experience the richest, most satisfying ghee India has ever produced.',
};

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  // Firestore Live Query for real-time document overrides
  const productRef = useMemoFirebase(() => id ? doc(db, 'products', id as string) : null, [db, id]);
  const { data: dbProduct } = useDoc(productRef);
  
  // Cart & Wishlist hooks
  const { cart, addToCart, updateQty, removeFromCart, totalQty } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Interactive States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('500mL Glass Jar');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Instant zero-delay resolution from catalog, with seamless Firestore overrides
  const product: Product = useMemo(() => {
    const catalogMatch = getProductById(id as string);

    if (dbProduct) {
      const basePrice = Number(dbProduct.basePrice) || Number(dbProduct.price) || (catalogMatch?.price ?? 1099);
      const rawVars = Array.isArray(dbProduct.vars) && dbProduct.vars.length > 0 
        ? dbProduct.vars 
        : (catalogMatch?.vars ?? VIVAAN_BUFFALO_VARIANTS);

      return {
        ...DEFAULT_BUFFALO_GHEE_PRODUCT,
        ...(catalogMatch || {}),
        ...dbProduct,
        id: dbProduct.id || (id as string),
        name: dbProduct.name || catalogMatch?.name || 'A2 Desi Buffalo Ghee',
        price: basePrice,
        vars: rawVars,
        imageUrls: Array.isArray(dbProduct.imageUrls) && dbProduct.imageUrls.length > 0
          ? dbProduct.imageUrls
          : (catalogMatch?.imageUrls ?? BUFFALO_GHEE_IMAGES)
      } as Product;
    }

    if (catalogMatch) {
      return {
        ...DEFAULT_BUFFALO_GHEE_PRODUCT,
        ...catalogMatch,
        id: catalogMatch.id || (id as string),
      } as Product;
    }

    // Default authentic Vivaan product representation
    return DEFAULT_BUFFALO_GHEE_PRODUCT;
  }, [dbProduct, id]);

  // Synchronize default variant and images
  useEffect(() => {
    if (product) {
      const defaultVar = product.vars.find((v: ProductVariant) => v.on) || product.vars[0];
      if (defaultVar) {
        setSelectedSize(defaultVar.s);
      }
    }
  }, [product]);

  // Active Variant & Pricing Calculations
  const getVariantPrice = (v?: ProductVariant): number => {
    if (!v) return product.price > 0 ? product.price : (product.basePrice || 1099);
    const vp = Number(v.p);
    if (vp > 0) return vp;
    const legacyPrice = Number((v as any).price);
    if (legacyPrice > 0) return legacyPrice;
    if (product.price > 0) return product.price;
    if (product.basePrice && product.basePrice > 0) return product.basePrice;
    return 1099;
  };

  const currentVar: ProductVariant = product.vars.find((v: ProductVariant) => v.s === selectedSize) || product.vars[0];
  const displayPrice = getVariantPrice(currentVar);
  const isWishlisted = isInWishlist(product.id);
  const galleryImages = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls : BUFFALO_GHEE_IMAGES;
  const activeImageSrc = galleryImages[selectedImgIndex] || galleryImages[0];

  // Cart quantity count for this specific product & size
  const cartItem = cart.find(c => c.id === product.id && (c.vol === selectedSize || !c.vol));
  const cartCountForThisProduct = cartItem ? cartItem.qty : 0;

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

  // Buy Now handler
  const handleBuyNow = () => {
    addToCart({ 
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
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap no-scrollbar">
          <span className="cursor-pointer hover:text-[#0D3B2E] transition-colors" onClick={() => router.push('/')}>
            Home
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="cursor-pointer hover:text-[#0D3B2E] transition-colors uppercase">
            A2 Ghee
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
              />
            </div>
          </div>

        </div>

      </main>

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
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
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
