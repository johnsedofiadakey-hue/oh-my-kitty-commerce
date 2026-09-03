import { formatMoney } from "@/lib/commerce/format";
import type { Order } from "@/lib/commerce/types";
import { getContentValue } from "@/lib/storefront/content";
import { isArkeselConfigured, sendSms } from "@/lib/notifications/arkesel";
import { serverEnv } from "@/lib/env/server";
import { signOrderFulfilToken } from "@/lib/admin/quick-action-token";

export type OrderNotificationEvent = "CONFIRMED" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "POS_COMPLETED";

/**
 * Best-effort SMS on key order events. Never throws — a notification
 * provider outage must not block a payment confirmation or fulfilment
 * update. Silently no-ops when Arkesel isn't configured or the order has
 * no phone on file (e.g. many walk-in POS sales).
 *
 * Callers intentionally fire this without awaiting it (`void
 * notifyOrderEvent(...)`) — the SMS round-trip (2-7s) must not add latency
 * to a payment confirmation or a POS/admin action's response. The
 * container stays warm long enough after the response to finish this in
 * the vast majority of cases; a mid-flight scale-down could drop it, but
 * that's an acceptable tradeoff for a non-critical notification. Never
 * `await` this from a request handler that needs to respond quickly.
 */
export async function notifyOrderEvent(order: Order, event: OrderNotificationEvent): Promise<void> {
  const phone = order.customerSnapshot?.phone;
  if (!phone || !isArkeselConfigured()) {
    return;
  }

  try {
    const message = await buildMessage(order, event);
    const result = await sendSms({ to: phone, message });
    if (!result.ok) {
      console.error(`Arkesel SMS failed for order ${order.orderNumber} (${event}): ${result.message}`);
    }
  } catch (error) {
    console.error(`Arkesel SMS threw for order ${order.orderNumber} (${event}):`, error);
  }
}

/**
 * Alerts the store owner's phone (ARKESEL_ADMIN_ALERT_PHONE) when a new
 * order comes in, online or POS. Same never-throws, fire-and-forget
 * contract as notifyOrderEvent — see its doc comment.
 */
export async function notifyAdminOfNewOrder(order: Order): Promise<void> {
  const adminPhone = serverEnv.ARKESEL_ADMIN_ALERT_PHONE;
  if (!adminPhone || !isArkeselConfigured()) {
    return;
  }

  try {
    const customerName = order.customerSnapshot?.name ?? "Walk-in customer";
    const itemSummary = summarizeItems(order.items);
    const actionLink = buildFulfilLink(order.orderNumber);
    const linePart = actionLink ? ` Fulfil: ${actionLink}` : "";
    const message = `Oh My Kitty: New order ${order.orderNumber} from ${customerName} (${order.channel}) — ${itemSummary}. Total ${formatMoney(order.total)}.${linePart}`;
    const result = await sendSms({ to: adminPhone, message });
    if (!result.ok) {
      console.error(`Arkesel admin alert failed for order ${order.orderNumber}: ${result.message}`);
    }
  } catch (error) {
    console.error(`Arkesel admin alert threw for order ${order.orderNumber}:`, error);
  }
}

/**
 * Kept deliberately short — just the status and a link. Full details
 * (items, totals, delivery address) live on the tracking page rather
 * than in the text itself.
 */
async function buildMessage(order: Order, event: OrderNotificationEvent): Promise<string> {
  const trackingLink = buildTrackingLink(order.orderNumber);
  const placeholders: Record<string, string> = {
    orderNumber: order.orderNumber,
    trackingLink,
    total: formatMoney(order.total)
  };

  switch (event) {
    case "CONFIRMED": {
      const template = await getContentValue("sms-confirmed-template");
      return fillTemplate(template, placeholders);
    }
    case "READY_FOR_PICKUP": {
      const [template, pickupLocation] = await Promise.all([
        getContentValue("sms-ready-pickup-template"),
        getContentValue("pickup-location")
      ]);
      return fillTemplate(template, { ...placeholders, pickupLocation });
    }
    case "OUT_FOR_DELIVERY": {
      const template = await getContentValue("sms-out-for-delivery-template");
      return fillTemplate(template, placeholders);
    }
    case "POS_COMPLETED": {
      const template = await getContentValue("sms-pos-completed-template");
      return fillTemplate(template, placeholders);
    }
  }
}

function fillTemplate(template: string, placeholders: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => placeholders[key] ?? match);
}

function buildTrackingLink(orderNumber: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmykittygh.com";
  return `${siteUrl}/track?order=${encodeURIComponent(orderNumber)}`;
}

function buildFulfilLink(orderNumber: string) {
  const token = signOrderFulfilToken(orderNumber);
  if (!token) {
    return null;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmykittygh.com";
  return `${siteUrl}/fulfil/${encodeURIComponent(orderNumber)}?token=${token}`;
}

/** Keeps the SMS to a couple of segments even for large carts — e.g. "2x Honey, 1x Kitty Oil +2 more". */
export function summarizeItems(items: Order["items"]) {
  const MAX_SHOWN = 3;
  const shown = items.slice(0, MAX_SHOWN).map((item) => `${item.quantity}x ${item.productTitle}`);
  const remainder = items.length - MAX_SHOWN;
  return remainder > 0 ? `${shown.join(", ")} +${remainder} more` : shown.join(", ");
}
