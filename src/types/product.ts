/**
 * Vivaan Farms — Full Product Data Model v2
 * Every field here maps 1-to-1 to a Firestore field.
 * The storefront and admin panel both use these types.
 */

// ── Core ─────────────────────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'published';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

// ── Product Image ─────────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  alt: string;
  order: number;       // 0-based display order; primary is the image with order=0 or isPrimary=true
  isPrimary: boolean;
}

// ── Variant ───────────────────────────────────────────────────────────────────

export interface ProductVariantV2 {
  id: string;                 // uuid / nanoid, stable key
  label: string;              // e.g. "500 g", "1 L", "250 ml"
  weightGrams: number;        // Always in grams for price/kg calc. Use 500 for 500 ml too (approx).
  price: number;              // Selling price in INR (never 0 for active variants)
  memberPrice: number;        // Member-discounted price in INR
  compareAtPrice: number;     // Strike-through / MRP
  stock: number;
  sku: string;
  isDefault: boolean;         // Exactly one variant per product must be true
  isActive: boolean;          // Hidden variants are not shown on storefront
  order: number;              // Display order
  // Derived — NEVER stored; always computed: price / weightGrams * 1000
  // pricePerKg: number;
}

// ── Info Tab ──────────────────────────────────────────────────────────────────

export interface InfoTab {
  id: string;           // stable key
  title: string;        // e.g. "Why It Tastes Better"
  richTextContent: string; // HTML string from rich-text editor
  order: number;
  enabled: boolean;
}

// ── Safe & Pure section ───────────────────────────────────────────────────────

export interface SafePureItem {
  text: string;
}

export interface SafePureSection {
  enabled: boolean;
  heading: string;
  subheading: string;
  items: SafePureItem[];
}

// ── Comparison Table ──────────────────────────────────────────────────────────

export interface ComparisonRow {
  label: string;
  vivaan: boolean;
  others: boolean;
}

export interface ComparisonSectionV2 {
  enabled: boolean;
  heading: string;
  rows: ComparisonRow[];
}

// ── Journey Section ───────────────────────────────────────────────────────────

export interface JourneyStep {
  number: number;
  title: string;
  description: string;
  icon?: string;        // emoji or icon name
}

export interface JourneySectionV2 {
  enabled: boolean;
  heading: string;
  subheading: string;
  steps: JourneyStep[];
}

// ── Money-Back Box ────────────────────────────────────────────────────────────

export interface MoneyBackBox {
  enabled: boolean;
  title: string;
  text: string;
}

// ── Trust Strip ───────────────────────────────────────────────────────────────

export interface TrustStrip {
  freeShippingThreshold: number;   // e.g. 699
  securePaymentsEnabled: boolean;
  codAvailable: boolean;
  showPaymentBadges: boolean;      // GPay, UPI, Visa
}

// ── Reviews Summary ───────────────────────────────────────────────────────────

export interface ReviewsSummary {
  useManualOverride: boolean;
  manualRating: number;    // only used when useManualOverride = true
  manualCount: number;
}

// ── SEO ───────────────────────────────────────────────────────────────────────

export interface ProductSeo {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

// ── Full Product V2 ───────────────────────────────────────────────────────────

export interface ProductV2 {
  // Firestore document ID
  id: string;

  // Basic
  title: string;                  // Display name — rendered Title Case
  slug: string;                   // URL slug, unique
  category: string;               // 'ghee' | 'honey' | 'sweets' | 'pickles' | etc.
  badgeLabel: string;             // e.g. "Creamy" — yellow pill above title
  status: ProductStatus;
  sku: string;
  shortDescription: string;       // Tagline under highlights

  // Images & Media
  images: ProductImage[];
  videoUrl?: string;
  certSealImage?: string;         // Round certification badge image URL

  // Pricing (base / fallback when no variants)
  basePrice: number;
  compareAtPrice: number;
  memberPrice?: number;
  memberDiscountPercent: number;  // e.g. 12 (for 12% off)

  // Variants
  variants: ProductVariantV2[];

  // Content sections
  highlights: string[];
  moneyBack: MoneyBackBox;
  trustStrip: TrustStrip;
  infoTabs: InfoTab[];
  safePure: SafePureSection;
  comparison: ComparisonSectionV2;
  journey: JourneySectionV2;

  // Reviews
  reviewsSummary: ReviewsSummary;

  // FAQs
  faqHeading: string;
  relatedProductIds: string[];

  // SEO
  seo: ProductSeo;

  // Timestamps (Firestore serverTimestamp)
  createdAt?: string;
  updatedAt?: string;
}

// ── Review V2 ─────────────────────────────────────────────────────────────────

export interface ReviewV2 {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userId?: string;          // empty for admin-added reviews
  customerName: string;
  userEmail?: string;
  rating: number;           // 1-5
  title: string;
  text: string;
  photos: string[];
  isVerified: boolean;
  date: string;             // ISO string; admin can override
  status: ReviewStatus;
  helpfulCount: number;
  helpfulUsers: string[];
  adminReply?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────

export interface FaqItem {
  id: string;
  groupName: string;                    // e.g. "Tracking And Shipping"
  question: string;
  answer: string;
  scope: 'global' | string;            // 'global' or a productId
  order: number;
  enabled: boolean;
}

// ── Site Settings ─────────────────────────────────────────────────────────────

export interface SiteSettings {
  announcementBarText: string;
  logoText: string;                     // e.g. "VIVAAN"
  logoSubText: string;                  // e.g. "ORGANIC FARMS"
  supportEmail: string;                 // e.g. "support@vivaanfarms.in"
  supportPhone: string;                 // e.g. "+91 99886 67848"
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  announcementBarText: 'Get 12% Off Permanently with Vivaan Membership',
  logoText: 'VIVAAN',
  logoSubText: 'ORGANIC FARMS',
  supportEmail: 'support@vivaanfarms.in',
  supportPhone: '+91 99886 67848',
};

export const DEFAULT_TRUST_STRIP: TrustStrip = {
  freeShippingThreshold: 699,
  securePaymentsEnabled: true,
  codAvailable: true,
  showPaymentBadges: true,
};

export const DEFAULT_MONEY_BACK: MoneyBackBox = {
  enabled: true,
  title: '100% Money Back Guaranteed',
  text: "Try it first. Every pack includes a Free 20ml tasting sample. If it doesn't meet your expectations, return it for a full 100% refund.",
};

export const EMPTY_SAFE_PURE: SafePureSection = {
  enabled: false,
  heading: "How Do You Know It's Safe & Pure?",
  subheading: 'Every batch is tested twice - once at source and again at our warehouse',
  items: [],
};

export const EMPTY_COMPARISON: ComparisonSectionV2 = {
  enabled: false,
  heading: 'What Makes Us Different?',
  rows: [],
};

export const EMPTY_JOURNEY: JourneySectionV2 = {
  enabled: false,
  heading: "From Our Farmers' To Your Kitchen",
  subheading: 'In Just 14 Days',
  steps: [],
};

/** Compute price/kg from a variant. Pure function, never stored. */
export function calcPricePerKg(price: number, weightGrams: number): number | null {
  if (!price || price <= 0 || !weightGrams || weightGrams <= 0) return null;
  return Math.round((price / weightGrams) * 1000);
}

/** Format INR price: Rs. 1,099.00 */
export function formatRupee(amount: number): string {
  return `Rs.\u00a0${amount.toLocaleString('en-IN')}.00`;
}

/** Convert title to Title Case */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Resolve the lowest active variant price (for "Starting from" display) */
export function startingFromPrice(variants: ProductVariantV2[]): number | null {
  const active = variants.filter(v => v.isActive && v.price > 0);
  if (!active.length) return null;
  return Math.min(...active.map(v => v.price));
}

/** Get the default variant (isDefault=true, or first active, or first) */
export function getDefaultVariant(variants: ProductVariantV2[]): ProductVariantV2 | null {
  if (!variants || !variants.length) return null;
  return (
    variants.find(v => v.isDefault && v.isActive) ||
    variants.find(v => v.isActive) ||
    variants[0]
  );
}
