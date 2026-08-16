import type {
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

export const sampleCategories: Category[] = [
  {
    id: "cat-intimate-care",
    title: "Intimate Care",
    slug: "intimate-care",
    sortOrder: 1,
    active: true
  },
  {
    id: "cat-wellness",
    title: "Wellness",
    slug: "wellness",
    sortOrder: 2,
    active: true
  }
];

export const sampleProducts: Product[] = [
  {
    id: "product-intimate-oil",
    title: "OMK Intimate Oil",
    slug: "omk-intimate-oil",
    shortCopy: "Soft daily care.",
    status: "ACTIVE",
    categoryIds: ["cat-intimate-care"],
    collectionIds: ["collection-hero"],
    tags: ["hero"],
    mediaIds: [],
    featured: true,
    homepagePriority: 1
  },
  {
    id: "product-slippery-elm",
    title: "Slippery Elm",
    slug: "slippery-elm",
    shortCopy: "Botanical wellness.",
    status: "ACTIVE",
    categoryIds: ["cat-wellness"],
    collectionIds: ["collection-hero"],
    tags: ["botanical"],
    mediaIds: [],
    featured: true,
    homepagePriority: 2
  }
];

export const sampleVariants: ProductVariant[] = [
  {
    id: "variant-intimate-oil-default",
    productId: "product-intimate-oil",
    title: "Default",
    sku: "OMK-OIL-DEFAULT",
    optionValues: { format: "Oil" },
    price: 9500,
    currency: "GHS",
    mediaIds: [],
    trackInventory: true,
    stockOnHand: 15,
    stockAvailable: 15,
    lowStockThreshold: 5,
    active: true
  },
  {
    id: "variant-slippery-elm-30",
    productId: "product-slippery-elm",
    title: "30 Capsules",
    sku: "OMK-SE-30",
    optionValues: { size: "30 Capsules" },
    price: 12000,
    currency: "GHS",
    mediaIds: [],
    trackInventory: true,
    stockOnHand: 22,
    stockAvailable: 22,
    lowStockThreshold: 5,
    active: true
  }
];

export const sampleCollections: Collection[] = [
  {
    id: "collection-hero",
    title: "Hero Products",
    slug: "hero-products",
    productIds: ["product-intimate-oil", "product-slippery-elm"],
    active: true,
    sortOrder: 1
  },
  {
    id: "collection-best-sellers",
    title: "Best Sellers",
    slug: "best-sellers",
    productIds: ["product-slippery-elm"],
    active: true,
    sortOrder: 2
  }
];

export const sampleMedia: MediaAsset[] = [
  {
    id: "media-intimate-oil-cutout",
    storagePath: "products/intimate-oil/cutout.webp",
    url: "https://example.local/products/intimate-oil/cutout.webp",
    type: "IMAGE",
    visibility: "PUBLIC",
    alt: "Oh My Kitty Intimate Oil product bottle",
    title: "Intimate Oil cutout",
    tags: ["product", "cutout", "hero"],
    usage: ["product", "homepage"],
    uploadedBy: "owner-1"
  }
];

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
