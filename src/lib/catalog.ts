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

export const ALL_PRODUCTS: Product[] = [
  // ── A2 GHEE ──
  {
    id: 'ghee-gir-tin-1l',
    name: 'A2 Desi Gir Cow Cultured Bilona Ghee (Heritage Tin)',
    cat: 'ghee',
    vol: '1000 ml (1 L)',
    price: 1850,
    mrpPrice: 2200,
    rating: 5.0,
    reviewCount: 940,
    purityCoins: 185,
    soldCountLabel: '5.2k sold',
    stock: 80,
    statusBadge: 'Traditional Metal Tin',
    badges: ['Top Rated', 'Bestseller'],
    pi: 0,
    imageUrls: ['/images/products/ghee_tin.jpg', '/images/products/ghee_jar.jpg'],
    vars: [
      { s: '500 ml', p: 980, mrp: 1150, on: false },
      { s: '1000 ml (1 L)', p: 1850, mrp: 2200, on: true },
      { s: '5000 ml (5 L)', p: 8900, mrp: 10500, on: false },
    ],
    description: 'Slow-cooked over slow wood fire in earthen pots, made from cultured A2 Gir curd using the two-way wooden bilona.'
  },
  {
    id: 'ghee-gir-jar-500ml',
    name: 'A2 Desi Gir Cow Cultured Bilona Ghee (Glass Jar)',
    cat: 'ghee',
    vol: '500 ml',
    price: 980,
    mrpPrice: 1150,
    rating: 4.9,
    reviewCount: 1420,
    purityCoins: 98,
    soldCountLabel: '8.4k sold',
    stock: 120,
    statusBadge: 'Golden Granular Danedar',
    badges: ['Bestseller'],
    pi: 1,
    imageUrls: ['/images/products/ghee_jar.jpg', '/images/products/ghee_tin.jpg'],
    vars: [
      { s: '250 ml', p: 520, mrp: 600, on: false },
      { s: '500 ml', p: 980, mrp: 1150, on: true },
      { s: '1000 ml (1 L)', p: 1850, mrp: 2200, on: false },
    ],
    description: 'Golden granular texture with intoxicating nutty aroma. High in natural CLA, butyric acid, and fat-soluble vitamins.'
  },
  {
    id: 'ghee-buffalo-murrah-1l',
    name: 'Vedic Pure Desi Murrah Buffalo Ghee (Bilona)',
    cat: 'ghee',
    vol: '1000 ml (1 L)',
    price: 1350,
    mrpPrice: 1600,
    rating: 4.9,
    reviewCount: 680,
    purityCoins: 135,
    soldCountLabel: '3.1k sold',
    stock: 90,
    statusBadge: 'High Smoke Point',
    badges: ['Heritage'],
    pi: 2,
    imageUrls: ['/images/products/ghee_tin.jpg'],
    vars: [
      { s: '500 ml', p: 720, mrp: 850, on: false },
      { s: '1000 ml (1 L)', p: 1350, mrp: 1600, on: true },
      { s: '5000 ml (5 L)', p: 6400, mrp: 7500, on: false },
    ],
    description: 'Handcrafted from grass-fed Murrah buffalo whole milk curd. Creamy white granular texture with deep richness.'
  },
  {
    id: 'ghee-hallikar-cow-500ml',
    name: 'Native Hallikar Cow Vedic Ghee (Rare Breed)',
    cat: 'ghee',
    vol: '500 ml',
    price: 1150,
    mrpPrice: 1350,
    rating: 4.9,
    reviewCount: 290,
    purityCoins: 115,
    soldCountLabel: '1.1k sold',
    stock: 45,
    statusBadge: 'Rare Indigenous Breed',
    badges: ['Artisanal'],
    pi: 3,
    imageUrls: ['/images/products/ghee_jar.jpg'],
    vars: [
      { s: '500 ml', p: 1150, mrp: 1350, on: true },
      { s: '1000 ml (1 L)', p: 2150, mrp: 2500, on: false },
    ],
    description: 'Sourced from agile indigenous Hallikar cows grazing on wild herbal shrubs. Intense therapeutic qualities.'
  },

  // ── HOMEMADE SWEETS ──
  {
    id: 'sweets-handmade-ladoo',
    name: 'Home made sweets (Artisanal Bilona Ghee Laddus)',
    cat: 'sweets',
    vol: '500 g',
    price: 450,
    mrpPrice: 550,
    rating: 4.9,
    reviewCount: 120,
    purityCoins: 45,
    soldCountLabel: '1.2k sold',
    stock: 55,
    statusBadge: 'Freshly Prepared',
    badges: ['Bestseller', 'No Refined Sugar'],
    pi: 4,
    imageUrls: ['/images/products/sweets.jpg'],
    vars: [
      { s: '250 g', p: 240, mrp: 290, on: false },
      { s: '500 g', p: 450, mrp: 550, on: true },
      { s: '1 kg (1000g)', p: 850, mrp: 1050, on: false },
    ],
    description: 'Traditional slow-roasted besan and dry fruit gond laddus made strictly with our in-house A2 Gir Bilona Ghee and organic dhaga mishri.'
  },
  {
    id: 'sweets-motichoor-peda',
    name: 'Vedic Mathura Peda & Dry Fruit Barfi Assortment',
    cat: 'sweets',
    vol: '500 g',
    price: 520,
    mrpPrice: 620,
    rating: 5.0,
    reviewCount: 95,
    purityCoins: 52,
    soldCountLabel: '850+ sold',
    stock: 40,
    statusBadge: 'A2 Gir Khoya Base',
    badges: ['Festive Pick'],
    pi: 5,
    imageUrls: ['/images/products/sweets.jpg'],
    vars: [
      { s: '250 g', p: 280, mrp: 330, on: false },
      { s: '500 g', p: 520, mrp: 620, on: true },
      { s: '1 kg', p: 980, mrp: 1190, on: false },
    ],
    description: 'Prepared by simmering whole A2 Gir milk on iron kadhai. Naturally flavored with crushed green cardamom and Kashmiri saffron.'
  },

  // ── NATURAL RAW HONEY ──
  {
    id: 'honey-wild-forest',
    name: 'Nautural honey (Raw Unprocessed Wild Forest Honey)',
    cat: 'honey',
    vol: '500 ml',
    price: 850,
    mrpPrice: 999,
    rating: 4.9,
    reviewCount: 120,
    purityCoins: 85,
    soldCountLabel: '4.8k sold',
    stock: 90,
    statusBadge: 'Selling Fast',
    badges: ['15% OFF', 'Unpasteurized & Raw'],
    pi: 6,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '250 g', p: 450, mrp: 520, on: false },
      { s: '500 ml', p: 850, mrp: 999, on: true },
      { s: '1 kg', p: 1550, mrp: 1850, on: false },
    ],
    description: 'Ethically harvested from wild bee colonies in Gujarat and Himachal deciduous forests. Rich in pollen enzymes and natural minerals.'
  },
  {
    id: 'honey-jamun-raw',
    name: 'Raw Organic Jamun Monofloral Honey',
    cat: 'honey',
    vol: '500 g',
    price: 540,
    mrpPrice: 650,
    rating: 4.8,
    reviewCount: 310,
    purityCoins: 54,
    soldCountLabel: '1.7k sold',
    stock: 50,
    statusBadge: 'Low Glycemic Index',
    badges: ['Single Origin'],
    pi: 7,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '500 g', p: 540, mrp: 650, on: true },
      { s: '1 kg', p: 990, mrp: 1200, on: false },
    ],
    description: 'Gathered by honeybees foraging exclusively on flowering Indian Blackberry (Jamun) trees. Deep amber color with herbal undertones.'
  },

  // ── WOOD PRESSED OILS ──
  {
    id: 'oil-mustard-yellow',
    name: 'Wood Pressed Yellow Mustard Oil (Kachi Ghani)',
    cat: 'oils',
    vol: '500 ml',
    price: 360,
    mrpPrice: 450,
    rating: 4.9,
    reviewCount: 420,
    purityCoins: 36,
    soldCountLabel: '2.8k sold',
    stock: 50,
    statusBadge: 'Cold-Pressed < 40°C',
    badges: ['Bestseller'],
    pi: 8,
    imageUrls: ['/images/products/mustard_oil.jpg'],
    vars: [
      { s: '500 ml', p: 360, mrp: 450, on: true },
      { s: '1 L', p: 680, mrp: 850, on: false },
      { s: '5 L Can', p: 3200, mrp: 3900, on: false },
    ],
    description: 'Slow-pressed from indigenous yellow mustard seeds. Rich pungent aroma and natural golden color.'
  },
  {
    id: 'oil-groundnut-cold',
    name: 'Wood Pressed Groundnut Oil (Peanut Oil)',
    cat: 'oils',
    vol: '5 L Can',
    price: 1850,
    mrpPrice: 2200,
    rating: 4.9,
    reviewCount: 310,
    purityCoins: 185,
    soldCountLabel: '1.9k sold',
    stock: 40,
    statusBadge: 'Zero Palm Oil',
    badges: ['Value Pack'],
    pi: 9,
    imageUrls: ['/images/products/groundnut_can.jpg'],
    vars: [
      { s: '1 L', p: 390, mrp: 480, on: false },
      { s: '5 L Can', p: 1850, mrp: 2200, on: true },
    ],
    description: 'Heart-healthy cooking oil extracted from handpicked Saurashtra peanuts on traditional wooden kolhu.'
  },
  {
    id: 'oil-mustard-black',
    name: 'Cold Pressed Black Mustard Oil (Kachi Ghani)',
    cat: 'oils',
    vol: '1 L',
    price: 340,
    mrpPrice: 420,
    rating: 4.8,
    reviewCount: 280,
    purityCoins: 34,
    soldCountLabel: '3.4k sold',
    stock: 65,
    statusBadge: 'High Pungency',
    badges: ['Tradition'],
    pi: 10,
    imageUrls: ['/images/products/mustard_oil.jpg'],
    vars: [
      { s: '500 ml', p: 180, mrp: 220, on: false },
      { s: '1 L', p: 340, mrp: 420, on: true },
    ],
    description: 'Authentic bold pungent black mustard oil, stone-filtered with zero chemicals or artificial color.'
  },
  {
    id: 'oil-virgin-coconut',
    name: 'Extra Virgin Cold Pressed Coconut Oil',
    cat: 'oils',
    vol: '500 ml',
    price: 490,
    mrpPrice: 590,
    rating: 5.0,
    reviewCount: 195,
    purityCoins: 49,
    soldCountLabel: '980+ sold',
    stock: 35,
    statusBadge: 'Raw & Centrifuged',
    badges: ['Multipurpose'],
    pi: 11,
    imageUrls: ['/images/products/mustard_oil.jpg'],
    vars: [
      { s: '500 ml', p: 490, mrp: 590, on: true },
      { s: '1 L', p: 890, mrp: 1050, on: false },
    ],
    description: 'Cold extracted from freshly squeezed coconut milk within 4 hours of harvest. Pure tropical aroma.'
  },

  // ── ATTA & STAPLES ──
  {
    id: 'staples-khapli-atta',
    name: 'Stone Ground Khapli (Emmer) Whole Wheat Atta',
    cat: 'staples',
    vol: '5 kg',
    price: 460,
    mrpPrice: 550,
    rating: 4.9,
    reviewCount: 380,
    purityCoins: 46,
    soldCountLabel: '2.1k sold',
    stock: 60,
    statusBadge: 'Ancient Wheat · Low Gluten',
    badges: ['Digestive Health'],
    pi: 12,
    imageUrls: ['/images/products/atta.jpg'],
    vars: [
      { s: '1 kg', p: 105, mrp: 125, on: false },
      { s: '5 kg', p: 460, mrp: 550, on: true },
      { s: '10 kg', p: 880, mrp: 1050, on: false },
    ],
    description: 'Heritage heirloom Emmer wheat cold-ground on slow stone chakki with 100% natural bran and wheat germ intact.'
  },
  {
    id: 'staples-organic-jaggery',
    name: 'Organic Desi Khand & Jaggery (Gur) Granules',
    cat: 'staples',
    vol: '1 kg',
    price: 195,
    mrpPrice: 240,
    rating: 4.9,
    reviewCount: 220,
    purityCoins: 19,
    soldCountLabel: '3.2k sold',
    stock: 75,
    statusBadge: 'Zero Chemicals / Sulphur',
    badges: ['Natural Sweetener'],
    pi: 13,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '1 kg', p: 195, mrp: 240, on: true },
      { s: '3 kg Box', p: 550, mrp: 690, on: false },
    ],
    description: 'Naturally clarified with okra root extract. Completely free of sodium hydrosulphite, bleaches, and synthetic binders.'
  },

  // ── SUPERFOODS ──
  {
    id: 'superfoods-chyawanprash',
    name: 'Heritage Vedic Amla Chyawanprash (A2 Ghee Base)',
    cat: 'superfoods',
    vol: '500 g',
    price: 580,
    mrpPrice: 690,
    rating: 5.0,
    reviewCount: 410,
    purityCoins: 58,
    soldCountLabel: '2.9k sold',
    stock: 50,
    statusBadge: 'Traditional Rasayana',
    badges: ['Immunity Booster'],
    pi: 14,
    imageUrls: ['/images/products/honey_jar.jpg'],
    vars: [
      { s: '500 g', p: 580, mrp: 690, on: true },
      { s: '1 kg', p: 1090, mrp: 1290, on: false },
    ],
    description: 'Slow-cooked wild amla fruit simmered in pure A2 Gir cow bilona ghee and infused with 48 potent forest herbs and raw honey.'
  },
  {
    id: 'superfoods-cultured-butter',
    name: 'Cultured A2 Gir Cow White Butter (Desi Makkhan)',
    cat: 'superfoods',
    vol: '500 g',
    price: 490,
    mrpPrice: 580,
    rating: 4.9,
    reviewCount: 160,
    purityCoins: 49,
    soldCountLabel: '1.4k sold',
    stock: 30,
    statusBadge: 'Cold-Churned Daily',
    badges: ['Fresh Batch'],
    pi: 15,
    imageUrls: ['/images/products/ghee_jar.jpg'],
    vars: [
      { s: '250 g', p: 260, mrp: 310, on: false },
      { s: '500 g', p: 490, mrp: 580, on: true },
    ],
    description: 'Freshly churned from cultured A2 curd every morning. Irresistibly rich, creamy, and wholesome.'
  },

  // ── COMBOS & VALUE PACKS ──
  {
    id: 'combo-ghee-twin-pack',
    name: 'A2 Desi Gir Cow Ghee Twin Value Pack (2 x 500ml)',
    cat: 'combos',
    vol: '1000 ml (2 Jars)',
    price: 1750,
    mrpPrice: 2300,
    rating: 5.0,
    reviewCount: 520,
    purityCoins: 175,
    soldCountLabel: '2.4k sold',
    stock: 60,
    statusBadge: 'Save ₹550',
    badges: ['Value Gift Pack', 'Bestseller'],
    pi: 16,
    imageUrls: ['/images/products/combo_pack.jpg'],
    vars: [
      { s: '2 x 500ml Jars', p: 1750, mrp: 2300, on: true }
    ],
    description: 'Double the goodness. Two premium glass jars of Vedic Bilona A2 Gir Cow Ghee at our lowest combo price.'
  },
  {
    id: 'combo-kitchen-trio',
    name: 'Vedic Kitchen Essentials Trio (Ghee + Oil + Honey)',
    cat: 'combos',
    vol: 'Ghee 500ml + Oil 1L + Honey 500g',
    price: 1980,
    mrpPrice: 2590,
    rating: 5.0,
    reviewCount: 230,
    purityCoins: 198,
    soldCountLabel: '1.6k sold',
    stock: 40,
    statusBadge: 'Save ₹610',
    badges: ['Family Starter Pack'],
    pi: 17,
    imageUrls: ['/images/products/combo_pack.jpg'],
    vars: [
      { s: 'Kitchen Trio Hamper', p: 1980, mrp: 2590, on: true }
    ],
    description: 'The ultimate clean pantry starter kit: 1 jar of A2 Gir Ghee, 1 bottle of Yellow Mustard Oil, and 1 jar of Raw Wild Honey.'
  }
];

export function getCategoryProducts(catId: string, customList?: Product[]): Product[] {
  const source = customList && customList.length > 0 ? customList : ALL_PRODUCTS;
  
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
      return cat === 'sweets' || cat === 'sweet' || name.includes('sweet') || name.includes('ladoo') || name.includes('peda') || name.includes('barfi') || name.includes('halwa') || name.includes('katli');
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
  const source = customList && customList.length > 0 ? customList : ALL_PRODUCTS;
  const normalized = id.toLowerCase().trim();
  return source.find(p => p.id?.toLowerCase() === normalized || (p as any).slug?.toLowerCase() === normalized);
}
