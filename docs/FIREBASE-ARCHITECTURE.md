# Firebase Architecture

## Architecture Goal

Use Firebase as the first-class platform for hosting, auth, data, storage, and privileged backend operations. Firebase details will be added later by the owner. No credentials belong in the repository.

## Default Stack

- Next.js App Router with TypeScript.
- Firebase App Hosting for deployment.
- Firebase Authentication for identity.
- Cloud Firestore as the primary database.
- Firebase Storage for product, site, and receipt/media assets.
- Cloud Functions or Firebase-backed server endpoints for privileged operations.
- Firebase Emulator Suite for local development and tests.

## Environments

Plan for:

- development
- staging, optional but recommended before launch
- production

Each environment should have its own Firebase project or clearly separated resources.

Never test real payment capture, live customer notifications, or destructive production writes from a development environment.

## Firebase Services

### Firebase Authentication

Use for:

- admin login
- staff/POS login
- optional customer accounts
- custom claims for coarse access

Admin-created staff accounts must be created through backend logic or an admin-only function.

### Firestore

Use for:

- products
- variants
- inventory ledgers
- orders
- payments
- customers
- users
- roles
- permissions
- content
- media metadata
- promotions
- delivery rules
- POS shifts
- approval records
- audit logs
- report projections

Firestore is the single source of truth for commerce state.

### Firebase Storage

Use for:

- product images
- transparent product cutouts
- homepage hero assets
- videos or animation stills
- CMS media
- receipt files if generated
- private admin uploads if needed

Store metadata in Firestore. Store binary files in Storage.

### Cloud Functions / Server Logic

Use backend logic for:

- creating admin/staff users
- assigning roles
- completing online checkout
- completing POS sale
- validating and applying discounts
- inventory reservations and movements
- payment webhook handling
- refunds
- voids
- manager approvals
- stock adjustments
- report projections
- notification sending

Do not rely on client-side writes alone for these operations.

## App Boundaries

Suggested route groups after implementation:

```text
app/(storefront)
app/(admin)
app/(pos)
```

Suggested shared modules:

```text
src/lib/firebase
src/lib/auth
src/lib/commerce
src/lib/permissions
src/lib/validation
src/lib/reports
src/components/storefront
src/components/admin
src/components/pos
```

Exact structure can change, but the boundaries must remain clear.

## Environment Variables

Use `.env.example` as the placeholder map.

Client-visible Firebase web config:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

Public app config:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SITE_NAME
APP_ENV
```

Server-side placeholders:

```text
GOOGLE_APPLICATION_CREDENTIALS
PAYMENT_PROVIDER
PAYMENT_PUBLIC_KEY
PAYMENT_SECRET_KEY
PAYMENT_WEBHOOK_SECRET
EMAIL_PROVIDER_API_KEY
SMS_PROVIDER_API_KEY
WHATSAPP_PROVIDER_TOKEN
SENTRY_DSN
```

For deployed environments, use Firebase/App Hosting secrets or Google Cloud Secret Manager where appropriate. Do not commit real values.

## Local Development

Phase 0 should set up:

- Next.js local app
- Firebase client initialization using placeholders
- Firebase Admin/server initialization safely gated
- Emulator Suite config
- Firestore rules file
- Storage rules file
- seed script for local emulator data
- tests that can run without real Firebase credentials

Local emulator ports should be documented once implemented.

## Privileged Operation Pattern

For important operations, use one backend endpoint/function per business action:

```text
completeOnlineOrder
completePosSale
createStaffUser
assignRole
adjustInventory
requestManagerApproval
approveRestrictedAction
refundOrder
voidPosSale
handlePaymentWebhook
```

Each operation should:

1. authenticate actor
2. load actor role/permissions
3. validate input
4. validate entity state
5. write transactionally where needed
6. write audit log
7. return a narrow response

## Firestore Transaction Rules

Use Firestore transactions/batched writes for:

- order creation plus inventory movement
- POS sale completion
- stock adjustment
- refund with inventory effect
- role assignment plus audit log
- manager approval plus action completion

Avoid read-modify-write patterns in client code for stock.

## Payment Architecture

Payment provider is TBD. Build provider adapter boundaries.

Required concepts:

- payment intent/session/reference
- provider name
- provider transaction id
- payment status
- order id
- idempotency key
- webhook event id

Payment secrets stay in server environment/secrets only.

## Delivery Architecture

Delivery details are TBD. The system should support:

- pickup
- local delivery
- nationwide delivery
- zone-based fees
- free delivery thresholds
- delivery notes and estimates

Admin should manage delivery settings.

## Reporting Architecture

Initial reports can query Firestore directly. As data grows, use scheduled backend jobs to write report projections.

Projection examples:

- daily sales summary
- product sales summary
- staff sales summary
- channel sales summary
- inventory movement summary

Reports must preserve source data and not replace order/payment records.

## Security Rules Strategy

Rules should:

- block unauthenticated sensitive access
- allow public reads only for active storefront content/products
- prevent direct client writes to orders, payments, inventory, roles, and audit logs
- allow admin/staff reads only based on claims/permissions
- require backend functions for sensitive mutations

Security rules must be tested with emulator tests.

## Firebase Setup Checklist For Owner

When ready, the owner should provide:

- Firebase project id
- Firebase web app config
- enabled Authentication providers
- Firestore enabled
- Storage enabled
- App Hosting configured
- billing plan if required for selected Firebase services
- domain later

Do not provide:

- service-account private keys in chat
- payment secret keys in chat
- webhook secrets in chat

## Acceptance Notes

Firebase architecture is not acceptable if:

- credentials are committed
- POS writes stock directly from client code
- admin role assignment is client-only
- security rules allow public writes to commerce data
- tests require production Firebase credentials
- online and POS sales use separate databases
