import type {
  AuditLog,
  Category,
  Collection,
  Customer,
  DeliveryRule,
  InventoryMovement,
  MediaAsset,
  Order,
  Payment,
  PosShift,
  Product,
  ProductVariant,
  Promotion
} from "@/lib/commerce/types";
import { defaultRoles } from "@/lib/permissions/permissions";

export const sampleCategories: Category[] = [
  {
    id: "cat-intimate-care",
    title: "Intimate Care",
    slug: "intimate-care",
    sortOrder: 1,
    active: true
  },
  {
    id: "cat-tone-shave-care",
    title: "Tone & Shaving Care",
    slug: "tone-shaving-care",
    sortOrder: 2,
    active: true
  },
  {
    id: "cat-feminine-wellness",
    title: "Feminine Wellness",
    slug: "feminine-wellness",
    sortOrder: 3,
    active: true
  },
  {
    id: "cat-herbal-support",
    title: "Herbal Support",
    slug: "herbal-support",
    sortOrder: 4,
    active: true
  },
  {
    id: "cat-libido-desire",
    title: "Libido & Desire",
    slug: "libido-desire",
    sortOrder: 5,
    active: true
  },
  {
    id: "cat-honey-drinks",
    title: "Honey & Drinks",
    slug: "honey-drinks",
    sortOrder: 6,
    active: true
  },
  {
    id: "cat-home-care",
    title: "Home Care",
    slug: "home-care",
    sortOrder: 7,
    active: true
  },
  {
    id: "cat-sets-bundles",
    title: "Sets & Bundles",
    slug: "sets-bundles",
    sortOrder: 8,
    active: true
  },
  {
    id: "cat-testing-accessories",
    title: "Testing & Accessories",
    slug: "testing-accessories",
    sortOrder: 9,
    active: true
  }
];

type ProductSeed = {
  id: string;
  title: string;
  slug: string;
  shortCopy: string;
  categoryIds: string[];
  tags: string[];
  image: string;
  variantId?: string;
  variantTitle: string;
  sku: string;
  optionValues: Record<string, string>;
  price: number;
  stock: number;
  featured?: boolean;
  homepagePriority?: number;
};

const productSeeds: ProductSeed[] = [
  {
    id: "product-normal-infection-set",
    title: "Normal Infection Set",
    slug: "normal-infection-set",
    shortCopy: "Starter care bundle with boric support, honey, wash, kitty oil and delivery.",
    categoryIds: ["cat-sets-bundles", "cat-feminine-wellness"],
    tags: ["set", "infection-care", "hero"],
    image: "normal-infection-set.jpeg",
    variantTitle: "Bundle",
    sku: "OMK-NORMAL-INFECTION-SET",
    optionValues: { package: "Set" },
    price: 44000,
    stock: 12,
    featured: true,
    homepagePriority: 1
  },
  {
    id: "product-dark-inner-thigh-set",
    title: "Dark Inner Thigh Set",
    slug: "dark-inner-thigh-set",
    shortCopy: "Oil and cream duo for inner thigh tone care.",
    categoryIds: ["cat-sets-bundles", "cat-tone-shave-care"],
    tags: ["set", "tone-care", "hero"],
    image: "dark-inner-thigh-set.jpeg",
    variantTitle: "Oil + Cream",
    sku: "OMK-DARK-INNER-THIGH-SET",
    optionValues: { package: "Oil + Cream" },
    price: 40000,
    stock: 10,
    featured: true,
    homepagePriority: 2
  },
  {
    id: "product-razor-bumps-ingrown-hair-set",
    title: "Razor Bumps & Ingrown Hair Set",
    slug: "razor-bumps-ingrown-hair-set",
    shortCopy: "Scrub and serum set for shaving-area care.",
    categoryIds: ["cat-sets-bundles", "cat-tone-shave-care"],
    tags: ["set", "shaving-care", "hero"],
    image: "razor-bumps-ingrown-hair-set.jpeg",
    variantTitle: "Scrub + Serum",
    sku: "OMK-RAZOR-BUMPS-SET",
    optionValues: { package: "Scrub + Serum" },
    price: 30000,
    stock: 14,
    featured: true,
    homepagePriority: 3
  },
  {
    id: "product-ph-balanced-kitty-mist",
    title: "pH Balanced Kitty Mist",
    slug: "ph-balanced-kitty-mist",
    shortCopy: "Intimate freshness mist for external use.",
    categoryIds: ["cat-intimate-care"],
    tags: ["freshness", "mist", "hero"],
    image: "ph-balanced-kitty-mist.jpeg",
    variantTitle: "100ml",
    sku: "OMK-KITTY-MIST-100ML",
    optionValues: { size: "100ml" },
    price: 10000,
    stock: 24,
    featured: true,
    homepagePriority: 4
  },
  {
    id: "product-feminine-wash",
    title: "Feminine Wash",
    slug: "feminine-wash",
    shortCopy: "pH balanced gentle wash for daily intimate care.",
    categoryIds: ["cat-intimate-care"],
    tags: ["wash", "daily-care", "hero"],
    image: "feminine-wash.jpeg",
    variantTitle: "100ml",
    sku: "OMK-FEMININE-WASH-100ML",
    optionValues: { size: "100ml" },
    price: 9000,
    stock: 26,
    featured: true,
    homepagePriority: 5
  },
  {
    id: "product-intimate-oil",
    title: "Kitty Oil",
    slug: "kitty-oil",
    shortCopy: "Intimate body oil for soft daily care.",
    categoryIds: ["cat-intimate-care"],
    tags: ["oil", "daily-care", "hero"],
    image: "kitty-oil.jpeg",
    variantId: "variant-intimate-oil-default",
    variantTitle: "30ml",
    sku: "OMK-KITTY-OIL-30ML",
    optionValues: { size: "30ml" },
    price: 7000,
    stock: 30,
    featured: true,
    homepagePriority: 6
  },
  {
    id: "product-iced-libido-boosting-sobolo",
    title: "Iced Libido Boosting Sobolo",
    slug: "iced-libido-boosting-sobolo",
    shortCopy: "Hibiscus drink positioned for energy and desire support.",
    categoryIds: ["cat-honey-drinks", "cat-libido-desire"],
    tags: ["drink", "libido", "hero"],
    image: "iced-libido-boosting-sobolo.jpeg",
    variantTitle: "500ml",
    sku: "OMK-ICED-SOBOLO-500ML",
    optionValues: { size: "500ml" },
    price: 8000,
    stock: 20,
    featured: true,
    homepagePriority: 7
  },
  {
    id: "product-slippery-elm",
    title: "Slippery Elms Dietary Supplement",
    slug: "slippery-elms-dietary-supplement",
    shortCopy: "Botanical supplement for feminine and body care.",
    categoryIds: ["cat-herbal-support", "cat-feminine-wellness"],
    tags: ["supplement", "botanical", "hero"],
    image: "slippery-elms.jpeg",
    variantId: "variant-slippery-elm-30",
    variantTitle: "20 Capsules",
    sku: "OMK-SE-30",
    optionValues: { count: "20 Capsules" },
    price: 20000,
    stock: 22,
    featured: true,
    homepagePriority: 8
  },
  {
    id: "product-chronic-infection-set",
    title: "Chronic Infection Set",
    slug: "chronic-infection-set",
    shortCopy: "Expanded bundle with herbs, boric support, honey, wash and kitty oil.",
    categoryIds: ["cat-sets-bundles", "cat-feminine-wellness", "cat-herbal-support"],
    tags: ["set", "infection-care"],
    image: "chronic-infection-set.jpeg",
    variantTitle: "Bundle",
    sku: "OMK-CHRONIC-INFECTION-SET",
    optionValues: { package: "Set" },
    price: 69000,
    stock: 8
  },
  {
    id: "product-menstrual-flow-set",
    title: "Menstrual Flow Set",
    slug: "menstrual-flow-set",
    shortCopy: "Herbal and slippery elms support set with delivery.",
    categoryIds: ["cat-sets-bundles", "cat-herbal-support"],
    tags: ["set", "period-care"],
    image: "intense-infection-flusher-herbs.jpeg",
    variantTitle: "Bundle",
    sku: "OMK-MENSTRUAL-FLOW-SET",
    optionValues: { package: "Set" },
    price: 43000,
    stock: 9
  },
  {
    id: "product-after-period-care-set",
    title: "After Period Care Set",
    slug: "after-period-care-set",
    shortCopy: "Boric support, wash, kitty oil and delivery care bundle.",
    categoryIds: ["cat-sets-bundles", "cat-feminine-wellness"],
    tags: ["set", "period-care"],
    image: "after-period-care-set.jpeg",
    variantTitle: "Bundle",
    sku: "OMK-AFTER-PERIOD-CARE-SET",
    optionValues: { package: "Set" },
    price: 31000,
    stock: 12
  },
  {
    id: "product-small-boric-acid",
    title: "Small Boric Acid",
    slug: "small-boric-acid",
    shortCopy: "Starter boric acid pack with dripping pills and delivery.",
    categoryIds: ["cat-feminine-wellness"],
    tags: ["boric-acid"],
    image: "after-period-care-set.jpeg",
    variantTitle: "Small Pack",
    sku: "OMK-BORIC-ACID-SMALL",
    optionValues: { pack: "Small" },
    price: 15000,
    stock: 18
  },
  {
    id: "product-big-boric-acid",
    title: "Big Boric Acid",
    slug: "big-boric-acid",
    shortCopy: "Large boric acid pack with honey and delivery.",
    categoryIds: ["cat-feminine-wellness"],
    tags: ["boric-acid"],
    image: "normal-infection-set.jpeg",
    variantTitle: "Big Pack",
    sku: "OMK-BORIC-ACID-BIG",
    optionValues: { pack: "Big" },
    price: 29000,
    stock: 14
  },
  {
    id: "product-small-dripping-pills",
    title: "Small Dripping Pills",
    slug: "small-dripping-pills",
    shortCopy: "Starter dripping pills pack with honey and delivery.",
    categoryIds: ["cat-feminine-wellness"],
    tags: ["dripping-pills"],
    image: "normal-infection-set.jpeg",
    variantTitle: "Small Pack",
    sku: "OMK-DRIPPING-PILLS-SMALL",
    optionValues: { pack: "Small" },
    price: 15000,
    stock: 18
  },
  {
    id: "product-big-dripping-pills",
    title: "Big Dripping Pills",
    slug: "big-dripping-pills",
    shortCopy: "Large dripping pills pack with honey and delivery.",
    categoryIds: ["cat-feminine-wellness"],
    tags: ["dripping-pills"],
    image: "normal-infection-set.jpeg",
    variantTitle: "Big Pack",
    sku: "OMK-DRIPPING-PILLS-BIG",
    optionValues: { pack: "Big" },
    price: 29000,
    stock: 14
  },
  {
    id: "product-genital-warts-burn-off-set",
    title: "Genital Warts Burn Off Set",
    slug: "genital-warts-burn-off-set",
    shortCopy: "Botanical wart remover and immune booster herbs bundle.",
    categoryIds: ["cat-sets-bundles", "cat-herbal-support"],
    tags: ["set", "botanical"],
    image: "genital-warts-burn-off-set.jpeg",
    variantTitle: "Bundle",
    sku: "OMK-WARTS-BURN-OFF-SET",
    optionValues: { package: "Set" },
    price: 45000,
    stock: 8
  },
  {
    id: "product-dark-inner-thigh-oil",
    title: "Dark Inner Thigh Oil",
    slug: "dark-inner-thigh-oil",
    shortCopy: "Radiant and even-tone oil for inner thigh care.",
    categoryIds: ["cat-tone-shave-care"],
    tags: ["tone-care", "oil"],
    image: "dark-inner-thigh-set.jpeg",
    variantTitle: "50ml",
    sku: "OMK-DARK-INNER-THIGH-OIL-50ML",
    optionValues: { size: "50ml" },
    price: 16000,
    stock: 16
  },
  {
    id: "product-dark-inner-thigh-cream",
    title: "Dark Inner Thigh Cream",
    slug: "dark-inner-thigh-cream",
    shortCopy: "Cream for inner thigh tone, brightness and smoothness care.",
    categoryIds: ["cat-tone-shave-care"],
    tags: ["tone-care", "cream"],
    image: "dark-inner-thigh-set.jpeg",
    variantTitle: "50g",
    sku: "OMK-DARK-INNER-THIGH-CREAM-50G",
    optionValues: { size: "50g" },
    price: 18000,
    stock: 16
  },
  {
    id: "product-razor-bumps-ingrown-hair-scrub",
    title: "Razor Bumps & Ingrown Hair Scrub",
    slug: "razor-bumps-ingrown-hair-scrub",
    shortCopy: "Exfoliating scrub for shaving-area care.",
    categoryIds: ["cat-tone-shave-care"],
    tags: ["scrub", "shaving-care"],
    image: "razor-bumps-ingrown-hair-set.jpeg",
    variantTitle: "100ml",
    sku: "OMK-RAZOR-BUMPS-SCRUB-100ML",
    optionValues: { size: "100ml" },
    price: 15000,
    stock: 20
  },
  {
    id: "product-razor-bumps-ingrown-hair-serum",
    title: "Razor Bumps & Ingrown Hair Serum",
    slug: "razor-bumps-ingrown-hair-serum",
    shortCopy: "Serum for bumps, ingrown hair and irritation care.",
    categoryIds: ["cat-tone-shave-care"],
    tags: ["serum", "shaving-care"],
    image: "razor-bumps-ingrown-hair-set.jpeg",
    variantTitle: "50ml",
    sku: "OMK-RAZOR-BUMPS-SERUM-50ML",
    optionValues: { size: "50ml" },
    price: 18000,
    stock: 20
  },
  {
    id: "product-applicator",
    title: "Applicator",
    slug: "applicator",
    shortCopy: "Clean, precise and comfortable applicator.",
    categoryIds: ["cat-testing-accessories"],
    tags: ["accessory"],
    image: "applicator.jpeg",
    variantTitle: "Single",
    sku: "OMK-APPLICATOR",
    optionValues: { unit: "Single" },
    price: 2000,
    stock: 40
  },
  {
    id: "product-wetness-pills",
    title: "Wetness Pills",
    slug: "wetness-pills",
    shortCopy: "Natural wetness support supplement.",
    categoryIds: ["cat-feminine-wellness", "cat-herbal-support"],
    tags: ["supplement", "wetness"],
    image: "wetness-pills.jpeg",
    variantTitle: "Bottle",
    sku: "OMK-WETNESS-PILLS",
    optionValues: { format: "Bottle" },
    price: 22000,
    stock: 12
  },
  {
    id: "product-intense-infection-flusher-herbs",
    title: "Intense Infection Flusher Herbs",
    slug: "intense-infection-flusher-herbs",
    shortCopy: "Herbal tea blend with twelve tea bags.",
    categoryIds: ["cat-herbal-support"],
    tags: ["herbs", "tea"],
    image: "intense-infection-flusher-herbs.jpeg",
    variantTitle: "150g",
    sku: "OMK-INFECTION-FLUSHER-HERBS-150G",
    optionValues: { size: "150g" },
    price: 25000,
    stock: 18
  },
  {
    id: "product-madurasa-honey",
    title: "Honey",
    slug: "honey",
    shortCopy: "Madurasa pure natural honey sachet.",
    categoryIds: ["cat-honey-drinks"],
    tags: ["honey"],
    image: "madurasa-honey.jpeg",
    variantTitle: "25g",
    sku: "OMK-HONEY-25G",
    optionValues: { size: "25g" },
    price: 1000,
    stock: 60
  },
  {
    id: "product-wild-honey",
    title: "Wild Honey Libido Boosting Honey",
    slug: "wild-honey-libido-boosting-honey",
    shortCopy: "Libido boosting honey from the intimate care range.",
    categoryIds: ["cat-honey-drinks", "cat-libido-desire"],
    tags: ["honey", "libido"],
    image: "libido-set.jpeg",
    variantTitle: "Bottle",
    sku: "OMK-WILD-HONEY",
    optionValues: { format: "Bottle" },
    price: 12000,
    stock: 14
  },
  {
    id: "product-libido-set",
    title: "Libido Set",
    slug: "libido-set",
    shortCopy: "Mixed libido support set with honey, drops, syrup and herbs.",
    categoryIds: ["cat-sets-bundles", "cat-libido-desire"],
    tags: ["set", "libido"],
    image: "libido-set.jpeg",
    variantTitle: "Bundle",
    sku: "OMK-LIBIDO-SET",
    optionValues: { package: "Set" },
    price: 25000,
    stock: 10
  },
  {
    id: "product-cloud-9-syrup",
    title: "Cloud 9 Syrup",
    slug: "cloud-9-syrup",
    shortCopy: "Libido syrup from the desire support range.",
    categoryIds: ["cat-libido-desire"],
    tags: ["syrup", "libido"],
    image: "libido-set.jpeg",
    variantTitle: "Bottle",
    sku: "OMK-CLOUD-9-SYRUP",
    optionValues: { format: "Bottle" },
    price: 12000,
    stock: 10
  },
  {
    id: "product-gold-fly-sex-drops",
    title: "Gold Fly Sex Drops",
    slug: "gold-fly-sex-drops",
    shortCopy: "Sex drops from the libido support range.",
    categoryIds: ["cat-libido-desire"],
    tags: ["drops", "libido"],
    image: "libido-set.jpeg",
    variantTitle: "Bottle",
    sku: "OMK-GOLD-FLY-DROPS",
    optionValues: { format: "Bottle" },
    price: 9000,
    stock: 10
  },
  {
    id: "product-libido-boosting-herbs",
    title: "Libido Boosting Herbs",
    slug: "libido-boosting-herbs",
    shortCopy: "Traditional herbal blend for libido support.",
    categoryIds: ["cat-libido-desire", "cat-herbal-support"],
    tags: ["herbs", "libido"],
    image: "libido-set.jpeg",
    variantTitle: "Jar",
    sku: "OMK-LIBIDO-HERBS",
    optionValues: { format: "Jar" },
    price: 16000,
    stock: 10
  },
  {
    id: "product-botanical-wart-remover",
    title: "Botanical Wart Remover",
    slug: "botanical-wart-remover",
    shortCopy: "Botanical formula from the wart care set.",
    categoryIds: ["cat-herbal-support"],
    tags: ["botanical", "wart-care"],
    image: "genital-warts-burn-off-set.jpeg",
    variantTitle: "100ml",
    sku: "OMK-BOTANICAL-WART-REMOVER-100ML",
    optionValues: { size: "100ml" },
    price: 18000,
    stock: 12
  },
  {
    id: "product-wc-sanitizer",
    title: "WC Sanitizer",
    slug: "wc-sanitizer",
    shortCopy: "Toilet cleaner, natural deodorizer and freshness spray.",
    categoryIds: ["cat-home-care"],
    tags: ["sanitizer", "home-care"],
    image: "wc-sanitizer.jpeg",
    variantTitle: "100ml",
    sku: "OMK-WC-SANITIZER-100ML",
    optionValues: { size: "100ml" },
    price: 6000,
    stock: 24
  },
  {
    id: "product-self-test-card",
    title: "Self-Test Card",
    slug: "self-test-card",
    shortCopy: "Private self-test card from the care accessories range.",
    categoryIds: ["cat-testing-accessories"],
    tags: ["test-card", "accessory"],
    image: "self-test-card.jpeg",
    variantTitle: "Single",
    sku: "OMK-SELF-TEST-CARD",
    optionValues: { unit: "Single" },
    price: 4000,
    stock: 30
  }
];

export const sampleProducts: Product[] = productSeeds.map((product) => ({
  id: product.id,
  title: product.title,
  slug: product.slug,
  shortCopy: product.shortCopy,
  status: "ACTIVE",
  categoryIds: product.categoryIds,
  collectionIds: [
    "collection-all-products",
    ...(product.featured ? ["collection-hero"] : []),
    ...(product.tags.includes("set") ? ["collection-sets"] : [])
  ],
  tags: product.tags,
  mediaIds: [mediaIdForProduct(product.id)],
  featured: product.featured ?? false,
  ...(product.homepagePriority !== undefined ? { homepagePriority: product.homepagePriority } : {})
}));

export const sampleVariants: ProductVariant[] = productSeeds.map((product) => ({
  id: product.variantId ?? `variant-${product.slug}`,
  productId: product.id,
  title: product.variantTitle,
  sku: product.sku,
  optionValues: product.optionValues,
  price: product.price,
  currency: "GHS",
  mediaIds: [mediaIdForProduct(product.id)],
  trackInventory: true,
  stockOnHand: product.stock,
  stockAvailable: product.stock,
  lowStockThreshold: 5,
  active: true
}));

export const sampleCollections: Collection[] = [
  {
    id: "collection-hero",
    title: "Hero Products",
    slug: "hero-products",
    productIds: productSeeds.filter((product) => product.featured).map((product) => product.id),
    active: true,
    sortOrder: 1
  },
  {
    id: "collection-all-products",
    title: "All Products",
    slug: "all-products",
    productIds: productSeeds.map((product) => product.id),
    active: true,
    sortOrder: 2
  },
  {
    id: "collection-sets",
    title: "Sets & Bundles",
    slug: "sets-bundles",
    productIds: productSeeds
      .filter((product) => product.tags.includes("set"))
      .map((product) => product.id),
    active: true,
    sortOrder: 3
  }
];

export const sampleMedia: MediaAsset[] = productSeeds.map((product) => ({
  id: mediaIdForProduct(product.id),
  storagePath: `products/${product.image}`,
  url: `/products/${product.image}`,
  type: "IMAGE",
  visibility: "PUBLIC",
  alt: `${product.title} product image`,
  title: product.title,
  tags: ["product", ...product.tags],
  usage: ["product", ...(product.featured ? ["homepage"] : [])],
  uploadedBy: "owner-1"
}));

function mediaIdForProduct(productId: string) {
  return `media-${productId.replace(/^product-/, "")}`;
}

export const sampleCustomers: Customer[] = [
  {
    id: "customer-walk-in",
    name: "Walk-in customer",
    email: null,
    phone: null,
    createdFrom: "POS"
  },
  {
    id: "customer-online-example",
    name: "Online Customer",
    email: "customer@example.local",
    phone: "+233000000000",
    createdFrom: "ONLINE"
  }
];

export const sampleOrders: Order[] = [
  {
    id: "order-online-example",
    orderNumber: "OMK-1001",
    channel: "ONLINE",
    status: "PAID",
    paymentStatus: "PAID",
    fulfilmentStatus: "UNFULFILLED",
    customerId: "customer-online-example",
    customerSnapshot: {
      name: "Online Customer",
      email: "customer@example.local",
      phone: "+233000000000"
    },
    items: [
      {
        productId: "product-slippery-elm",
        variantId: "variant-slippery-elm-30",
        productTitle: "Slippery Elm",
        variantTitle: "30 Capsules",
        sku: "OMK-SE-30",
        quantity: 1,
        unitPrice: 12000,
        discountTotal: 0,
        lineTotal: 12000
      }
    ],
    subtotal: 12000,
    discountTotal: 0,
    deliveryTotal: 0,
    taxTotal: 0,
    total: 12000,
    currency: "GHS",
    createdBy: null,
    staffId: null,
    posShiftId: null,
    idempotencyKey: "seed-online-order"
  },
  {
    id: "order-pos-example",
    orderNumber: "OMK-1002",
    channel: "POS",
    status: "PAID",
    paymentStatus: "PAID",
    fulfilmentStatus: "FULFILLED",
    customerId: "customer-walk-in",
    customerSnapshot: {
      name: "Walk-in customer"
    },
    items: [
      {
        productId: "product-intimate-oil",
        variantId: "variant-intimate-oil-default",
        productTitle: "OMK Intimate Oil",
        variantTitle: "Default",
        sku: "OMK-OIL-DEFAULT",
        quantity: 1,
        unitPrice: 9500,
        discountTotal: 0,
        lineTotal: 9500
      }
    ],
    subtotal: 9500,
    discountTotal: 0,
    deliveryTotal: 0,
    taxTotal: 0,
    total: 9500,
    currency: "GHS",
    createdBy: "staff-1",
    staffId: "staff-1",
    posShiftId: "shift-open-example",
    idempotencyKey: "seed-pos-order"
  }
];

export const samplePayments: Payment[] = [
  {
    id: "payment-online-example",
    orderId: "order-online-example",
    provider: "TBD",
    method: "manual_transfer",
    status: "PAID",
    amount: 12000,
    currency: "GHS",
    providerReference: null,
    idempotencyKey: "seed-online-order"
  },
  {
    id: "payment-pos-example",
    orderId: "order-pos-example",
    provider: "CASH",
    method: "cash",
    status: "PAID",
    amount: 9500,
    currency: "GHS",
    providerReference: null,
    idempotencyKey: "seed-pos-order"
  }
];

export const sampleInventoryMovements: InventoryMovement[] = [
  {
    id: "movement-online-example",
    productId: "product-slippery-elm",
    variantId: "variant-slippery-elm-30",
    type: "ONLINE_SALE",
    quantityDelta: -1,
    stockAfter: 22,
    orderId: "order-online-example",
    reason: "Seed online sale",
    actorId: "system:seed",
    channel: "ONLINE"
  },
  {
    id: "movement-pos-example",
    productId: "product-intimate-oil",
    variantId: "variant-intimate-oil-default",
    type: "POS_SALE",
    quantityDelta: -1,
    stockAfter: 15,
    orderId: "order-pos-example",
    reason: "Seed POS sale",
    actorId: "staff-1",
    channel: "POS"
  }
];

export const samplePromotions: Promotion[] = [
  {
    id: "promo-welcome10",
    code: "WELCOME10",
    type: "PERCENT",
    value: 10,
    active: true,
    channelRestrictions: ["ONLINE"],
    productRestrictions: [],
    categoryRestrictions: [],
    startsAt: null,
    endsAt: null,
    usageLimit: 100,
    usedCount: 0,
    requiresManagerApproval: false
  }
];

export const sampleDeliveryRules: DeliveryRule[] = [
  {
    id: "delivery-pickup",
    name: "Pickup",
    type: "PICKUP",
    active: true,
    regions: [],
    fee: 0,
    freeAbove: null,
    estimate: "Ready when confirmed",
    sortOrder: 1
  },
  {
    id: "delivery-accra",
    name: "Accra Delivery",
    type: "LOCAL_DELIVERY",
    active: true,
    regions: ["Accra"],
    fee: 2500,
    freeAbove: null,
    estimate: "Same or next day",
    sortOrder: 2
  }
];

export const samplePosShifts: PosShift[] = [
  {
    id: "shift-open-example",
    staffId: "staff-1",
    status: "OPEN",
    openedAt: new Date("2026-01-01T08:00:00.000Z"),
    openingCash: 50000
  }
];

export const sampleAuditLogs: AuditLog[] = [
  {
    id: "audit-seed-product",
    actorId: "owner-1",
    action: "products.create",
    entityType: "product",
    entityId: "product-slippery-elm",
    summary: "Created Slippery Elm product",
    createdAt: new Date("2026-01-01T08:15:00.000Z")
  },
  {
    id: "audit-seed-pos-sale",
    actorId: "staff-1",
    action: "orders.complete_sale",
    entityType: "order",
    entityId: "order-pos-example",
    summary: "Completed POS sale",
    createdAt: new Date("2026-01-01T09:30:00.000Z")
  }
];

export const sampleUsers = [
  {
    uid: "owner-1",
    displayName: "Owner",
    email: "owner@example.local",
    status: "ACTIVE",
    roleIds: ["role-owner"],
    type: "ADMIN_OR_STAFF",
    posEnabled: true
  },
  {
    uid: "staff-1",
    displayName: "Sales Staff",
    email: "staff@example.local",
    status: "ACTIVE",
    roleIds: ["role-sales-staff"],
    type: "ADMIN_OR_STAFF",
    posEnabled: true,
    createdBy: "owner-1"
  }
];

export const sampleRoles = defaultRoles;
