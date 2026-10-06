import { z, ZodError } from "zod";
import type { ProductStatus } from "@/lib/commerce/types";

export const adminActionStateSchema = z.object({
  status: z.enum(["idle", "success", "error"]),
  message: z.string(),
  productId: z.string().optional(),
  variantId: z.string().optional()
});

export type AdminActionState = z.infer<typeof adminActionStateSchema>;
export type AdminFormAction = (
  previousState: AdminActionState,
  formData: FormData
) => Promise<AdminActionState>;

export const initialAdminActionState: AdminActionState = {
  status: "idle",
  message: ""
};

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formOptionalString(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value ? value : undefined;
}

export function formInteger(formData: FormData, key: string, fallback = 0) {
  const value = formString(formData, key);
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a whole number.`);
  }

  return parsed;
}

/** Decimal quantities — materials are measured in ml/g, not whole units. */
export function formNumber(formData: FormData, key: string, fallback = 0) {
  const value = formString(formData, key);
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a number.`);
  }

  return parsed;
}

export function formOptionalInteger(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a whole number.`);
  }

  return parsed;
}

/** Unlike formMoneyMinorUnit, blank means "not set" (null) rather than 0 — for optional prices like a sale's compare-at price. */
export function formOptionalMoneyMinorUnit(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${key} must be a valid amount.`);
  }

  return Math.round(Number(normalized) * 100);
}

export function formMoneyMinorUnit(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${key} must be a valid amount.`);
  }

  return Math.round(Number(normalized) * 100);
}

/** Parses an <input type="date"> value ("YYYY-MM-DD") into a real Date, defaulting to today when left blank. */
export function formDate(formData: FormData, key: string) {
  const value = formString(formData, key);
  if (!value) {
    return new Date();
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${key} must be a valid date.`);
  }

  return parsed;
}

export function formProductStatus(formData: FormData, key: string): ProductStatus {
  const value = formString(formData, key);
  if (value === "ACTIVE" || value === "DRAFT" || value === "ARCHIVED") {
    return value;
  }

  return "DRAFT";
}

export function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Turns a thrown validation error into something a shop owner can act on.
 *
 * A ZodError's own `.message` is the raw issue array serialised as JSON — the
 * admin forms were rendering that straight to screen, so mistyping a field
 * produced a wall of `{"origin":"string","code":"invalid_format", ...}` on
 * her phone. Zod's per-issue messages are already written in plain English;
 * this surfaces those instead, labelled with the field they belong to.
 */
export function humanizeActionError(error: unknown, fallback = "Save failed.") {
  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => {
      const field = issue.path.filter((part) => typeof part === "string").join(" ");
      return field ? `${fieldLabel(field)}: ${issue.message}` : issue.message;
    });

    // Repeated issues on one field (several rules failing at once) only need
    // saying once.
    return [...new Set(messages)].join(" ");
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

/** "lowStockThreshold" -> "Low stock threshold", so the label reads like the form. */
function fieldLabel(field: string) {
  const spaced = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
