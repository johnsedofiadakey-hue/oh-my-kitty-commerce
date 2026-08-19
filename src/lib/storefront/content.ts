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
  "pickup-location": {
    label: "Pickup location",
    group: "Contact",
    defaultValue: "Accra-Madina"
  }
} as const;

export type ContentKey = keyof typeof CONTENT_REGISTRY;

export async function getContentBlocks(): Promise<Record<ContentKey, string>> {
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
}

export async function getContentValue(key: ContentKey): Promise<string> {
  const blocks = await getContentBlocks();
  return blocks[key];
}

function defaultContentBlocks(): Record<ContentKey, string> {
  return Object.fromEntries(
    (Object.keys(CONTENT_REGISTRY) as ContentKey[]).map((key) => [key, CONTENT_REGISTRY[key].defaultValue])
  ) as Record<ContentKey, string>;
}
