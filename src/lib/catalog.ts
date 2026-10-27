import { Product } from '@/types';

export interface CategoryDef {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerImage?: string;
  icon?: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'all',
    name: 'All Products',
    slug: 'all',
    description: 'Explore our complete farm-to-table range of artisanal Vedic A2 Ghee and pure homemade sweets.',
    icon: '✨'
  },
  {
    id: 'ghee',
    name: 'A2 Ghee',
    slug: 'ghee',
    description: 'Handcrafted over slow wood fire in earthen pots, churned from curd using the traditional two-way wooden bilona.',
    icon: '🐄'
  },
  {
    id: 'sweets',
    name: 'Sweets',
    slug: 'sweets',
    description: 'Artisanal homemade sweets crafted strictly with pure A2 Gir Cow Bilona Ghee, organic jaggery, and premium whole nuts.',
    icon: '🍬'
  },
  {
    id: 'honey',
    name: 'Raw Forest Honey',
    slug: 'honey',
    description: '100% pure unheated raw forest honey, ethically harvested with zero added sugar and full active pollen enzymes.',
    icon: '🍯'
  },
  {
    id: 'oils',
    name: 'Cold Pressed Oils',
    slug: 'oils',
    description: 'Traditional wood-pressed (Kachi Ghani) pure native seed oils extracted without heat or chemicals.',
    icon: '🌱'
  },
  {
    id: 'combos',
    name: 'Healthy Combos',
    slug: 'combos',
    description: 'Curated wellness hampers and purity packs combining our signature ghee, wild honey, and oils.',
    icon: '🎁'
  }
];

export const SIDEBAR_CATEGORIES: CategoryDef[] = [
  {
    id: 'ghee',
    name: 'A2 Desi Ghee',
    slug: 'ghee',
    description: 'Handcrafted over slow wood fire in earthen pots, churned from curd using the traditional two-way wooden bilona.',
    icon: '🐄'
  },
  {
    id: 'sweets',
    name: 'Homemade Sweets',
    slug: 'sweets',
    description: 'Artisanal homemade sweets crafted strictly with pure A2 Gir Cow Bilona Ghee, organic jaggery, and premium whole nuts.',
    icon: '🍬'
  },
  {
    id: 'honey',
    name: 'Raw Forest Honey',
    slug: 'honey',
    description: '100% pure unheated raw forest honey, ethically harvested with zero added sugar and full active pollen enzymes.',
    icon: '🍯'
  }
];

// Pure Firestore Data Model: No hardcoded or mock products
export const ALL_PRODUCTS: Product[] = [];

export function getCategoryProducts(catId: string, customList?: Product[]): Product[] {
  const source = customList || [];
  
  if (!catId || catId === 'all') {
    return source;
  }

  const normalized = catId.toLowerCase().trim();

  return source.filter(p => {
    const cat = (p.cat || (p as any).categoryId || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const id = (p.id || '').toLowerCase();

    if (normalized === 'ghee') {
      return cat === 'ghee' || name.includes('ghee') || id.includes('ghee');
    }
    if (normalized === 'sweets' || normalized === 'sweet') {
      return cat === 'sweets' || cat === 'sweet' || name.includes('sweet') || name.includes('ladoo') || name.includes('laddu') || name.includes('peda') || name.includes('barfi') || name.includes('halwa') || name.includes('katli');
    }
    if (normalized === 'honey') {
      return cat === 'honey' || name.includes('honey') || id.includes('honey');
    }
    if (normalized === 'oils' || normalized === 'oil') {
      return cat === 'oils' || cat === 'oil' || name.includes('oil') || id.includes('oil');
    }
    if (normalized === 'combos' || normalized === 'combo') {
      return cat === 'combos' || cat === 'combo' || name.includes('combo') || name.includes('hamper') || id.includes('combo');
    }

    return cat === normalized || cat.includes(normalized);
  });
}

export function getProductById(id: string, customList?: Product[]): Product | undefined {
  if (!id) return undefined;
  const source = customList || [];
  const normalized = id.toLowerCase().trim();
  return source.find(p => p.id?.toLowerCase() === normalized || (p as any).slug?.toLowerCase() === normalized);
}
