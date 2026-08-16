# Security Specification

## Security Goal

Protect customer data, staff access, inventory truth, payment integrity, media assets, and admin operations while keeping development practical with Firebase.

## Secrets Policy

Never commit:

- Firebase service-account JSON files
- `.env.local`
- payment secret keys
- webhook secrets
- private API keys
- notification provider secrets

Use:

- `.env.example` for placeholders
- `.env.local` for local development
- Firebase/App Hosting secrets or Google Cloud Secret Manager for deployed secrets
- Google Application Default Credentials in deployed Google/Firebase environments when possible

The initial owner is bootstrapped with a server-side script using Firebase Admin. The script reads only the owner UID and email from environment variables, writes the owner Firestore user record and default roles, and sets custom claims. The owner password must never be written to source, docs, seed data, or environment files.

Admin browser sessions use an HTTP-only Firebase session cookie created by `/api/auth/session` after Firebase client sign-in. Server actions must verify that cookie and the admin claim before making privileged writes.

## Authentication

Use Firebase Authentication for:

- admin
- staff/POS
- customer accounts if enabled

Requirements:

- staff accounts are admin-created
- deactivated users lose access
- custom claims support coarse app access
- detailed permissions are evaluated server-side

## Authorization

Use RBAC from `docs/PERMISSIONS.md`.

Enforce authorization in:

- UI routing
- server/backend functions
- Firestore rules
- Storage rules

Do not rely on UI hiding alone.

## Sensitive Operations

These must go through backend/server logic:

- create staff/admin user
- update user roles
- update permissions
- complete online order
- complete POS sale
- adjust stock
- issue refund
- void transaction
- override price
- apply restricted discount
- process payment webhook
- write audit log

## Firestore Rules Strategy

Public unauthenticated reads can be allowed only for:

- active storefront products
- active categories/collections
- published content pages
- safe public site settings

Block public writes.

Authenticated customer writes should be narrow:

- own profile, if accounts are enabled
- cart/session records if implemented in Firestore
- orders only through backend logic, not direct client creation for paid orders

Admin/staff access:

- use claims and permission checks
- restrict PII
- restrict role and settings writes
- restrict inventory ledger writes to backend

## Storage Rules Strategy

Public reads:

- public product/site media only

Restricted writes:

- media upload requires `media.upload`
- media delete requires `media.delete`
- private receipts/documents require authenticated authorized access

Never allow broad public writes to Storage.

## Payment Security

Payment provider is TBD. Regardless of provider:

- secret keys remain server-side only
- webhook signatures must be verified
- webhook event ids must be stored for idempotency
- payment status must not be trusted from client redirects alone
- order fulfilment should depend on verified payment state
- refunds require permission and audit logs

## Inventory Security

Inventory cannot be trusted from client code.

Rules:

- stock movement is ledgered
- stock changes are backend-validated
- manual adjustments require reason and permission
- refund/return stock effects are explicit
- order completion and stock decrement happen in a transaction where possible

## POS Security

POS requirements:

- staff auth required
- active role required
- active shift required if shift policy is enabled
- sale completion uses idempotency key
- discount/override/refund limits enforced server-side
- manager approval checked server-side
- receipts show only appropriate customer data

## Customer Privacy

Protect:

- phone
- email
- address
- order history
- notes
- payment references

Do not store raw payment card data in Firestore.

Customer PII access requires permissions such as `customers.view_pii`.

## Health And Product Claims

Because products relate to feminine hygiene and wellness:

- avoid unapproved medical claims
- keep product usage and warnings editable but reviewed by client
- do not claim treatment, cure, or guaranteed results unless legally approved
- preserve approved wording in CMS

## Validation

Use schema validation for:

- product create/update
- variant update
- checkout payload
- POS sale payload
- discount payload
- inventory adjustment
- role update
- delivery settings
- webhook payloads

Reject unknown or unsafe fields.

## Audit Logging

Audit logs are required for:

- role changes
- staff creation/deactivation
- stock adjustments
- price changes
- refunds
- voids
- restricted discounts
- manager approvals
- settings changes
- payment webhook failures

Audit logs should be append-only and permission-restricted.

## Rate Limiting And Abuse Protection

Plan for:

- Firebase App Check where appropriate
- rate limiting on public forms and checkout endpoints
- validation against repeated payment submissions
- idempotency keys for order/payment creation
- webhook replay detection

## Backups And Recovery

Before production:

- define Firestore backup/export strategy
- document restore procedure
- avoid destructive migrations
- keep audit logs for critical changes

## Security Testing

Phase 0 and later should include:

- Firebase emulator rules tests
- role/permission tests
- POS sale permission tests
- inventory mutation tests
- payment webhook idempotency tests once payment provider exists

## Security Acceptance Notes

Security is not acceptable if:

- real secrets exist in git
- Firestore public writes are allowed
- POS staff can escalate roles
- inventory can be changed without a ledger
- webhooks are not verified
- client-side payment success alone marks orders paid
- PII is readable by unauthorized staff
