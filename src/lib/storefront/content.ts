import { cache } from "react";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { toWhatsAppLink } from "@/lib/storefront/whatsapp";

export { toWhatsAppLink };

/**
 * A curated set of editable copy slots — not an open-ended CMS. Admin can
 * change the value of any key below; it can't invent new keys or pages.
 * That keeps this safe to expose broadly (no arbitrary-content injection
 * risk) while still solving the real problem: this phone number was
 * hardcoded in four different files, so changing it meant a developer
 * editing four files instead of the store owner editing one setting.
 */
export const CONTENT_REGISTRY = {
  "whatsapp-number": {
    label: "WhatsApp number",
    group: "Contact",
    defaultValue: "0241448231"
  },
  "consult-whatsapp-number": {
    label: "WhatsApp number for the homepage \"Get guidance\" button",
    group: "Contact",
    defaultValue: "0549420566"
  },
  "pickup-location": {
    label: "Pickup location",
    group: "Contact",
    defaultValue: "Accra-Madina"
  },
  "pickup-map-link": {
    label: "Pickup map link (Google Maps URL)",
    group: "Contact",
    defaultValue: "https://maps.google.com/?q=5.675043,-0.144152"
  },
  "sms-confirmed-template": {
    label: "SMS: payment confirmed (placeholders: {orderNumber}, {trackingLink})",
    group: "SMS templates",
    defaultValue: "Oh My Kitty: Payment confirmed for order {orderNumber}! Track it: {trackingLink}"
  },
  "sms-ready-pickup-template": {
    label: "SMS: ready for pickup (placeholders: {orderNumber}, {pickupLocation}, {trackingLink})",
    group: "SMS templates",
    defaultValue: "Oh My Kitty: Order {orderNumber} is ready for pickup at {pickupLocation}. Track: {trackingLink}"
  },
  "sms-out-for-delivery-template": {
    label: "SMS: out for delivery (placeholders: {orderNumber}, {trackingLink})",
    group: "SMS templates",
    defaultValue: "Oh My Kitty: Order {orderNumber} is out for delivery! Track: {trackingLink}"
  },
  "shop-closed": {
    label: "Shop status (takes up to 30s to apply)",
    group: "Storefront",
    defaultValue: "false",
    options: [
      { value: "false", label: "Open — taking orders" },
      { value: "true", label: "Closed — pause new orders" }
    ]
  },
  "shop-closed-message": {
    label: "Message shown while closed",
    group: "Storefront",
    defaultValue:
      "We're taking a short break and aren't able to take new orders right now. Thank you for your patience — check back soon."
  }
} as const;

/** True only for keys whose registry entry declares a fixed `options` list — everything else renders as free text. */
export function isSelectContentKey(key: ContentKey): boolean {
  return "options" in CONTENT_REGISTRY[key];
}

const SHOP_CLOSED_CACHE_TTL_MS = 30_000;
let shopClosedCache: { value: boolean; expiresAt: number } | null = null;

/**
 * Checked on every storefront request (see proxy.ts), so unlike the rest of
 * this file it can't rely on React's per-request cache() alone — that only
 * dedupes within a single page render, not across the many separate
 * requests a busy storefront makes per second. A short TTL cache trades up
 * to 30s of propagation delay on this one admin toggle (a rare, deliberate
 * action) for avoiding a Firestore read on every single request.
 */
export async function isShopClosed(): Promise<boolean> {
  const now = Date.now();
  if (shopClosedCache && shopClosedCache.expiresAt > now) {
    return shopClosedCache.value;
  }

  const value = (await getContentValue("shop-closed")) === "true";
  shopClosedCache = { value, expiresAt: now + SHOP_CLOSED_CACHE_TTL_MS };
  return value;
}

export type ContentKey = keyof typeof CONTENT_REGISTRY;

/** cache()'d so the many independent getContentValue() callers on one page share a single Firestore read instead of one each. */
export const getContentBlocks = cache(async (): Promise<Record<ContentKey, string>> => {
  const defaults = defaultContentBlocks();
  const context = getCommerceServerContext();
  if (!context) {
    return defaults;
  }

  try {
    const blocks = await context.repo.listContentBlocks();
    const overrides = new Map(blocks.map((block) => [block.key, block.value]));

    return Object.fromEntries(
      (Object.keys(CONTENT_REGISTRY) as ContentKey[]).map((key) => [
        key,
        overrides.get(key) ?? defaults[key]
      ])
    ) as Record<ContentKey, string>;
  } catch {
    return defaults;
  }
});

export async function getContentValue(key: ContentKey): Promise<string> {
  const blocks = await getContentBlocks();
  return blocks[key];
}

function defaultContentBlocks(): Record<ContentKey, string> {
  return Object.fromEntries(
    (Object.keys(CONTENT_REGISTRY) as ContentKey[]).map((key) => [key, CONTENT_REGISTRY[key].defaultValue])
  ) as Record<ContentKey, string>;
}
