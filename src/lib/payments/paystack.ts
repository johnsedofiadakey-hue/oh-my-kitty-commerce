import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env/server";

const PAYSTACK_API_BASE = "https://api.paystack.co";

export type PaystackInitResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type PaystackVerifyResult = {
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending" | "unknown";
  amount: number;
  currency: string;
  paidAt: string | null;
};

export function isPaystackConfigured() {
  return Boolean(serverEnv.PAYSTACK_SECRET_KEY);
}

/** Paystack's transaction API requires an email; customers who skip the field get this instead. */
export function placeholderEmailForPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-9) || "guest";
  return `${digits}@guest.ohmykitty.com`;
}

function requireSecretKey() {
  if (!serverEnv.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  return serverEnv.PAYSTACK_SECRET_KEY;
}

/**
 * Starts a Paystack transaction. amountMinorUnit must be in the smallest currency
 * unit (pesewas for GHS) — Paystack, like this app's Order/Payment model, never
 * works in major currency units.
 */
export async function initializePaystackTransaction(input: {
  amountMinorUnit: number;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResult> {
  const secretKey = requireSecretKey();

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: input.amountMinorUnit,
      email: input.email,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: "GHS",
      metadata: input.metadata ?? {}
    })
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Could not start Paystack payment.");
  }

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code,
    reference: payload.data.reference
  };
}

export type MobileMoneyProvider = "mtn" | "vod" | "atl";

export type PaystackChargeResult = {
  reference: string;
  status: "pay_offline" | "send_otp" | "success" | "failed" | "pending" | "unknown";
  displayText: string | null;
};

/**
 * Starts a direct mobile money charge (Paystack's /charge endpoint, distinct
 * from the redirect-based /transaction/initialize used for online checkout).
 * This is what actually pushes the USSD/PIN prompt to the customer's phone —
 * the returned status is almost never "success" immediately; the caller must
 * poll verifyPaystackTransaction with the same reference until it resolves.
 */
export async function chargePaystackMobileMoney(input: {
  amountMinorUnit: number;
  email: string;
  reference: string;
  phone: string;
  provider: MobileMoneyProvider;
  metadata?: Record<string, unknown>;
}): Promise<PaystackChargeResult> {
  const secretKey = requireSecretKey();

  const response = await fetch(`${PAYSTACK_API_BASE}/charge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: input.amountMinorUnit,
      email: input.email,
      currency: "GHS",
      reference: input.reference,
      mobile_money: { phone: input.phone, provider: input.provider },
      metadata: input.metadata ?? {}
    })
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { status: string; reference: string; display_text?: string };
  };

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Could not start the mobile money charge.");
  }

  const status = payload.data.status;
  const knownStatuses: PaystackChargeResult["status"][] = [
    "pay_offline",
    "send_otp",
    "success",
    "failed",
    "pending"
  ];

  return {
    reference: payload.data.reference,
    status: knownStatuses.includes(status as PaystackChargeResult["status"])
      ? (status as PaystackChargeResult["status"])
      : "unknown",
    displayText: payload.data.display_text ?? null
  };
}

/**
 * Verifies a transaction directly with Paystack's servers — this is the only
 * source of truth for whether a payment actually succeeded. Never trust a
 * client-supplied "payment successful" callback or an unverified webhook body.
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  const secretKey = requireSecretKey();

  const response = await fetch(
    `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` }
    }
  );

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { status: string; amount: number; currency: string; reference: string; paid_at: string | null };
  };

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Could not verify Paystack transaction.");
  }

  const status = payload.data.status;
  return {
    reference: payload.data.reference,
    status:
      status === "success" || status === "failed" || status === "abandoned" || status === "pending"
        ? status
        : "unknown",
    amount: payload.data.amount,
    currency: payload.data.currency,
    paidAt: payload.data.paid_at
  };
}

/**
 * Verifies the `x-paystack-signature` header Paystack sends on every webhook
 * call. The signature is an HMAC-SHA512 of the raw request body, keyed with
 * the account's secret key. A webhook whose signature doesn't match must be
 * discarded — it did not come from Paystack.
 */
export function verifyPaystackWebhookSignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) {
    return false;
  }

  const secretKey = requireSecretKey();
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signatureHeader, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
