import { z } from "zod";
import type { ProductStatus } from "@/lib/commerce/types";

export const adminActionStateSchema = z.object({
  status: z.enum(["idle", "success", "error"]),
  message: z.string()
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
