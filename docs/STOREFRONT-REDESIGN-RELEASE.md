# Storefront Redesign Release Plan

## Purpose

Release the new public Oh My Kitty storefront without changing Firestore data,
orders, payments, inventory, admin, POS, or the established customer-facing
homepage until the owner explicitly enables it.

## Rollback anchor

- Production source anchor: `2b1043f9307a9a36eeee50d22eee79245b8e880e`
- Local rollback tag: `pre-storefront-redesign-20261002`
- Release branch: `codex/omk-storefront-redesign`

The tag must be pushed before any production rollout. The deployed Cloud Run
revision must be checked against the source anchor before it is called a
rollback target.

## Allowed release scope

- Public homepage composition, visual assets, motion, and responsive CSS.
- Public shop, product-detail, learning, and public navigation styling.
- The server-side `HOME_EXPERIENCE` homepage switch.
- Public loading and footer presentation.

## Explicitly excluded

- Firestore rules, indexes, data migrations, seed scripts, and Storage rules.
- Commerce operations, product/variant data, prices, stock, orders, payments,
  Paystack webhooks, notifications, and authentication.
- Admin portal, POS, receipt, packing-slip, dispatch, and fulfilment code.
- The unrelated dispatch-guide PDF deletion and five local-only operational
  commits currently ahead of `origin/main`.

## Experience switch

The homepage must preserve both implementations:

- `HOME_EXPERIENCE=cinematic`: existing customer homepage.
- `HOME_EXPERIENCE=matrix`: redesigned public homepage.
- Unset in production: defaults to `cinematic`.

The switch is server-side. Changing it produces a new Cloud Run revision but
does not write to Firestore or alter customer, order, inventory, or payment
data. Reverting the flag to `cinematic` is the primary rollback path.

## Release sequence

1. Port only the allowed public files into this branch. Storefront styles must
   be scoped to the public route group; do not replace shared operational CSS.
2. Verify source diff contains no excluded paths and no secret material.
3. Run `npm run check`, `git diff --check`, and Firebase rules tests using
   JDK 21 or later.
4. Deploy to a no-traffic Cloud Run revision/tag or a dedicated staging
   service with `HOME_EXPERIENCE=matrix`.
5. Manually verify home, shop, a product page, cart, checkout entry, order
   tracking, admin login, and POS access at 360px, 390px, 430px, and desktop.
   Do not submit a live Paystack payment during this release test.
6. Deploy the release code with production still set to `cinematic`. Verify
   the existing public journey against live Firestore data.
7. After explicit owner approval, set `HOME_EXPERIENCE=matrix` and verify the
   new public journey. Refresh Firebase Hosting only as needed to prevent a
   stale `public/` asset snapshot shadowing the Cloud Run revision.

## Rollback sequence

1. Set `HOME_EXPERIENCE=cinematic` on the Cloud Run service.
2. Verify the existing homepage, shop, cart, checkout entry, admin login, and
   POS entry.
3. If the issue is broader than the presentation switch, route traffic back to
   the tagged prior Cloud Run revision.

Neither rollback action changes Firestore data.

## Compliance gate

Do not use an FDA logo, approval language, or registration claim until the
client supplies verifiable evidence for the specific product claim. The
redesign may retain neutral trust and payment presentation in the meantime.
