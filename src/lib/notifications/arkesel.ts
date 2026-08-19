import { serverEnv } from "@/lib/env/server";

const ARKESEL_SMS_API_BASE = "https://sms.arkesel.com/sms/api";

export type ArkeselSendResult = {
  ok: boolean;
  code: string | null;
  message: string;
};

export function isArkeselConfigured() {
  return Boolean(serverEnv.ARKESEL_API_KEY && serverEnv.ARKESEL_SENDER_ID);
}

/** `0241448231` -> `233241448231`, the format Arkesel expects for Ghanaian numbers. */
function toArkeselRecipient(localNumber: string) {
  const digits = localNumber.replace(/\D/g, "");
  return digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
}

/**
 * Sends one SMS via Arkesel's v1 query-string API. Arkesel replies with
 * {code: "ok", message: "Successfully Sent"} on success — any other code
 * (e.g. an invalid API key or insufficient balance) is a failure. Never
 * assume success from just an HTTP 200; confirmed against a live send.
 */
export async function sendSms(input: { to: string; message: string }): Promise<ArkeselSendResult> {
  if (!serverEnv.ARKESEL_API_KEY || !serverEnv.ARKESEL_SENDER_ID) {
    throw new Error("Arkesel is not configured (missing ARKESEL_API_KEY or ARKESEL_SENDER_ID).");
  }

  const params = new URLSearchParams({
    action: "send-sms",
    api_key: serverEnv.ARKESEL_API_KEY,
    to: toArkeselRecipient(input.to),
    from: serverEnv.ARKESEL_SENDER_ID,
    sms: input.message,
    response: "json"
  });

  const response = await fetch(`${ARKESEL_SMS_API_BASE}?${params.toString()}`);
  const raw = await response.text();

  let payload: { code?: string; message?: string } = {};
  try {
    payload = JSON.parse(raw) as { code?: string; message?: string };
  } catch {
    payload = { message: raw };
  }

  const code = payload.code ?? null;
  const ok = response.ok && code?.toLowerCase() === "ok";

  return {
    ok,
    code,
    message: payload.message ?? (ok ? "SMS submitted." : "SMS send failed.")
  };
}
