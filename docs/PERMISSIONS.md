# Permissions And RBAC

## Goal

Permissions must let admin create staff accounts and control exactly what each staff member can see and do. RBAC must be enforced in UI, server logic, and Firestore/Storage security rules.

## Model

Use:

- users
- roles
- permissions
- optional user-specific permission overrides
- manager approval records
- audit logs

Roles are collections of permissions. Users are assigned one or more roles. Custom roles must be supported.

## Baseline Roles

Suggested starting roles:

- Owner
- Admin
- Manager
- Sales Staff
- Fulfilment Staff
- Inventory Staff
- Content Staff
- Support Staff

These are defaults, not hardcoded permanent limits.

## Permission Naming

Use action-oriented permissions:

```text
admin.access
dashboard.view
products.view
products.create
products.update
products.archive
products.publish
products.price.update
media.view
media.upload
media.delete
content.view
content.update
orders.view
orders.view_all
orders.update_status
orders.cancel
orders.refund
orders.void
fulfilment.view
fulfilment.update
inventory.view
inventory.receive
inventory.adjust
inventory.view_ledger
customers.view
customers.create
customers.update
customers.view_pii
promotions.view
promotions.create
promotions.update
promotions.delete
reports.view
reports.financial
pos.access
pos.sell
pos.discount
pos.price_override
pos.refund
pos.void
pos.shift.open
pos.shift.close
pos.receipts.view
users.view
users.create
users.update
users.deactivate
roles.view
roles.create
roles.update
settings.view
settings.update
audit.view
```

## Suggested Role Matrix

| Permission Area | Owner | Admin | Manager | Sales Staff | Fulfilment | Inventory | Content |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin access | yes | yes | yes | optional | yes | yes | yes |
| POS sell | yes | yes | yes | yes | no | no | no |
| Products view | yes | yes | yes | yes | yes | yes | yes |
| Products edit | yes | yes | optional | no | no | optional | no |
| Product price edit | yes | yes | optional | no | no | no | no |
| Orders view all | yes | yes | yes | own/assigned | yes | optional | no |
| Fulfilment update | yes | yes | yes | optional | yes | no | no |
| Inventory adjust | yes | yes | optional | no | no | yes | no |
| Customers view PII | yes | yes | yes | limited | limited | no | no |
| Promotions manage | yes | yes | optional | no | no | no | optional |
| Reports financial | yes | yes | optional | no | no | no | no |
| Users/Roles manage | yes | optional | no | no | no | no | no |
| Settings update | yes | optional | no | no | no | no | no |
| Audit view | yes | yes | optional | no | no | no | no |

This table is guidance. The implementation should use configurable roles and permissions.

## Sales Staff Default

Recommended default permissions:

```text
pos.access
pos.sell
products.view
orders.view
customers.view
customers.create
pos.receipts.view
pos.shift.open
pos.shift.close
```

Optional:

```text
pos.discount
orders.view_all
customers.update
```

Not default:

```text
inventory.adjust
reports.financial
settings.update
roles.update
users.create
pos.refund
pos.void
pos.price_override
```

## Limits

Some permissions need numeric limits:

- maximum POS discount percent
- maximum POS discount amount
- maximum refund amount without manager approval
- whether price override is allowed
- whether cash drawer close difference is allowed without manager note

Store limits with the role assignment or role config.

## Manager Approval

Actions that may require approval:

- refund
- void
- large discount
- price override
- manual inventory adjustment
- order cancellation after payment

Approval must be server-validated and audit-logged.

## Firebase Auth Claims

Use Firebase custom claims sparingly for coarse access:

- `isAdmin`
- `isStaff`
- `roleIds`
- `permissionsVersion`

Do not put large permission maps in custom claims if they risk token size or stale access. Use Firestore role documents for detailed permission evaluation and refresh claims when needed.

## Enforcement Layers

UI:

- hide or disable unavailable actions
- explain missing permission where helpful

Server:

- validate every privileged operation
- check actor, role, permission, limits, entity state, and reason

Firestore rules:

- block direct writes to sensitive collections
- allow narrow reads/writes only where safe
- require auth and role/claim checks

Storage rules:

- restrict uploads/deletes to media permissions
- restrict private documents and receipts if any

## Audit Requirement

Every privileged action writes an audit log:

- actor id
- action
- entity type/id
- permission used
- reason if required
- approval id if required
- timestamp

## Revocation

When a user's role changes or account is deactivated:

- update Firestore user record
- refresh custom claims
- block access immediately through backend checks
- require sign-out or token refresh where needed

## Acceptance Notes

RBAC is not acceptable if:

- POS staff can access admin settings by changing URL
- staff can create their own accounts
- permissions only hide buttons but backend still accepts writes
- custom roles are impossible
- manager approvals are recorded only in UI state
- audit logs are missing for privileged actions
