# Data Model

## Data Model Goal

Create one shared commerce model for storefront, admin, and POS. The model must preserve inventory truth, sales channel reporting, RBAC, and auditability.

Firestore collection names below are recommended starting points. Implementation can adjust names if the same relationships and safety rules are preserved.

## Core Entities

```text
users
roles
products
categories
collections
media
customers
orders
payments
inventoryMovements
promotions
deliveryRules
posShifts
approvalRequests
auditLogs
contentPages
siteSettings
reportProjections
```

## Users

Collection: `users`

Purpose: app profile for Firebase Auth users.

Fields:

```json
{
  "uid": "firebase-auth-uid",
  "displayName": "string",
  "email": "string",
  "phone": "string",
  "status": "ACTIVE",
  "roleIds": ["role-owner"],
  "type": "ADMIN_OR_STAFF_OR_CUSTOMER",
  "posEnabled": true,
  "createdBy": "uid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "deactivatedAt": "timestamp|null"
}
```

Statuses:

- `ACTIVE`
- `INVITED`
- `DISABLED`

## Roles

Collection: `roles`

Fields:

```json
{
  "id": "role-sales-staff",
  "name": "Sales Staff",
  "description": "Can sell through POS with limited access.",
  "permissions": ["pos.access", "pos.sell", "products.view"],
  "limits": {
    "maxDiscountPercent": 10,
    "maxRefundAmount": 0,
    "canOverridePrice": false
  },
  "system": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Products

Collection: `products`

Fields:

```json
{
  "id": "product-id",
  "title": "Slippery Elm",
  "slug": "slippery-elm",
  "shortCopy": "One-line storefront copy.",
  "description": "Longer approved product description.",
  "status": "ACTIVE",
  "categoryIds": ["cat-wellness"],
  "collectionIds": ["collection-best-sellers"],
  "tags": ["botanical"],
  "mediaIds": ["media-1"],
  "featured": true,
  "homepagePriority": 10,
  "seo": {
    "title": "string",
    "description": "string"
  },
  "care": {
    "usage": "string",
    "ingredients": "string",
    "warnings": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Statuses:

- `DRAFT`
- `ACTIVE`
- `ARCHIVED`

## Product Variants

Recommended as subcollection: `products/{productId}/variants`

Fields:

```json
{
  "id": "variant-id",
  "title": "30 Capsules",
  "sku": "OMK-SE-30",
  "barcode": "optional",
  "optionValues": {
    "size": "30 Capsules"
  },
  "price": 12000,
  "currency": "GHS",
  "compareAtPrice": null,
  "cost": null,
  "mediaIds": [],
  "trackInventory": true,
  "stockOnHand": 25,
  "stockAvailable": 25,
  "lowStockThreshold": 5,
  "active": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Prices should be stored in minor units. For GHS, store pesewas.

## Categories

Collection: `categories`

Fields:

```json
{
  "id": "cat-intimate-care",
  "title": "Intimate Care",
  "slug": "intimate-care",
  "description": "string",
  "mediaId": "media-id",
  "sortOrder": 1,
  "active": true,
  "seo": {
    "title": "string",
    "description": "string"
  }
}
```

## Collections

Collection: `collections`

Used for curated groups such as homepage features or best sellers.

Fields:

```json
{
  "id": "collection-best-sellers",
  "title": "Best Sellers",
  "slug": "best-sellers",
  "productIds": ["product-id"],
  "active": true,
  "sortOrder": 1
}
```

## Media

Collection: `media`

Fields:

```json
{
  "id": "media-id",
  "storagePath": "products/product-id/image.webp",
  "url": "https://...",
  "type": "IMAGE",
  "alt": "Product photo of Slippery Elm bottle",
  "title": "Slippery Elm front",
  "tags": ["product", "cutout"],
  "usage": ["product", "homepage"],
  "uploadedBy": "uid",
  "createdAt": "timestamp"
}
```

Media types:

- `IMAGE`
- `VIDEO`
- `ANIMATION_FRAME`
- `DOCUMENT`

## Customers

Collection: `customers`

Fields:

```json
{
  "id": "customer-id",
  "authUid": "uid|null",
  "name": "string",
  "email": "string|null",
  "phone": "string|null",
  "addresses": [],
  "notes": "string",
  "createdFrom": "ONLINE_OR_POS_OR_ADMIN",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Customer PII requires permission-controlled reads.

## Orders

Collection: `orders`

Fields:

```json
{
  "id": "order-id",
  "orderNumber": "OMK-1001",
  "channel": "ONLINE",
  "status": "PAID",
  "paymentStatus": "PAID",
  "fulfilmentStatus": "UNFULFILLED",
  "customerId": "customer-id|null",
  "customerSnapshot": {
    "name": "string",
    "email": "string|null",
    "phone": "string|null"
  },
  "items": [],
  "subtotal": 12000,
  "discountTotal": 0,
  "deliveryTotal": 0,
  "taxTotal": 0,
  "total": 12000,
  "currency": "GHS",
  "createdBy": "uid|null",
  "staffId": "uid|null",
  "posShiftId": "shift-id|null",
  "idempotencyKey": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Order item snapshot:

```json
{
  "productId": "product-id",
  "variantId": "variant-id",
  "productTitle": "Slippery Elm",
  "variantTitle": "30 Capsules",
  "sku": "OMK-SE-30",
  "quantity": 1,
  "unitPrice": 12000,
  "discountTotal": 0,
  "lineTotal": 12000,
  "mediaUrl": "https://..."
}
```

Orders store snapshots so historical receipts survive product edits.

## Payments

Collection: `payments`

Fields:

```json
{
  "id": "payment-id",
  "orderId": "order-id",
  "provider": "CASH_OR_PAYSTACK_OR_TBD",
  "method": "cash",
  "status": "PAID",
  "amount": 12000,
  "currency": "GHS",
  "providerReference": "string|null",
  "webhookEventIds": [],
  "idempotencyKey": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Payment statuses:

- `PENDING`
- `AUTHORIZED`
- `PAID`
- `FAILED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`

## Inventory Movements

Collection: `inventoryMovements`

Purpose: immutable ledger of stock changes.

Fields:

```json
{
  "id": "movement-id",
  "productId": "product-id",
  "variantId": "variant-id",
  "type": "POS_SALE",
  "quantityDelta": -1,
  "stockAfter": 24,
  "orderId": "order-id|null",
  "reason": "POS sale",
  "actorId": "uid",
  "channel": "POS",
  "createdAt": "timestamp"
}
```

Types:

- `STOCK_RECEIVED`
- `ONLINE_SALE`
- `POS_SALE`
- `ADMIN_CREATED_SALE`
- `RETURN_TO_STOCK`
- `REFUND_NO_STOCK_RETURN`
- `DAMAGE`
- `LOSS`
- `MANUAL_ADJUSTMENT`

## Promotions

Collection: `promotions`

Fields:

```json
{
  "id": "promo-id",
  "code": "WELCOME10",
  "type": "PERCENT",
  "value": 10,
  "active": true,
  "channelRestrictions": ["ONLINE"],
  "productRestrictions": [],
  "categoryRestrictions": [],
  "startsAt": "timestamp",
  "endsAt": "timestamp",
  "usageLimit": 100,
  "usedCount": 0,
  "requiresManagerApproval": false
}
```

## Delivery Rules

Collection: `deliveryRules`

Fields:

```json
{
  "id": "delivery-accra",
  "name": "Accra Delivery",
  "type": "LOCAL_DELIVERY",
  "active": true,
  "regions": ["Accra"],
  "fee": 2500,
  "freeAbove": null,
  "estimate": "Same or next day",
  "sortOrder": 1
}
```

## POS Shifts

Collection: `posShifts`

Fields:

```json
{
  "id": "shift-id",
  "staffId": "uid",
  "status": "OPEN",
  "openedAt": "timestamp",
  "closedAt": "timestamp|null",
  "openingCash": 50000,
  "closingCash": null,
  "expectedCash": null,
  "difference": null,
  "notes": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Statuses:

- `OPEN`
- `CLOSED`
- `REVIEWED`

## Approval Requests

Collection: `approvalRequests`

Fields:

```json
{
  "id": "approval-id",
  "status": "APPROVED",
  "action": "POS_REFUND",
  "requestedBy": "uid",
  "approvedBy": "uid|null",
  "orderId": "order-id|null",
  "amount": 12000,
  "reason": "Customer return",
  "createdAt": "timestamp",
  "resolvedAt": "timestamp|null"
}
```

Statuses:

- `PENDING`
- `APPROVED`
- `DENIED`
- `EXPIRED`

## Audit Logs

Collection: `auditLogs`

Fields:

```json
{
  "id": "audit-id",
  "actorId": "uid",
  "action": "inventory.adjust",
  "entityType": "inventoryMovement",
  "entityId": "movement-id",
  "summary": "Adjusted stock for SKU OMK-SE-30",
  "reason": "Stock count correction",
  "approvalId": "approval-id|null",
  "createdAt": "timestamp"
}
```

Audit logs should be append-only.

## Content Pages

Collection: `contentPages`

Fields:

```json
{
  "id": "about",
  "slug": "about",
  "title": "About Oh My Kitty",
  "status": "PUBLISHED",
  "sections": [],
  "seo": {
    "title": "string",
    "description": "string"
  },
  "updatedBy": "uid",
  "updatedAt": "timestamp"
}
```

## Site Settings

Collection: `siteSettings`

Recommended single document: `siteSettings/main`

Fields:

```json
{
  "storeName": "Oh My Kitty",
  "currency": "GHS",
  "siteUrl": "https://example.com",
  "contact": {
    "email": "string",
    "phone": "string",
    "whatsapp": "string"
  },
  "receipt": {
    "footerText": "string"
  },
  "updatedAt": "timestamp"
}
```

Do not store secrets in site settings.

## Report Projections

Collection: `reportProjections`

Examples:

- `reportProjections/dailySales_YYYY_MM_DD`
- `reportProjections/productSales_YYYY_MM`
- `reportProjections/staffSales_YYYY_MM`

These are derived from orders, payments, shifts, and inventory movements.

## Data Model Acceptance Notes

The model is not acceptable if:

- product edits break historical order receipts
- inventory movements can be silently edited
- POS and online orders cannot be compared by channel
- users and customers are confused as the same entity
- payment records are embedded only in order text
- role data is hardcoded in UI only
