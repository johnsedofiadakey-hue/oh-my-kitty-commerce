import { z } from "zod";

const serverEnvSchema = z.object({
  APP_ENV: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: z.string().optional(),
  BOOTSTRAP_OWNER_UID: z.string().optional(),
  BOOTSTRAP_OWNER_EMAIL: z.string().optional(),
  BOOTSTRAP_OWNER_DISPLAY_NAME: z.string().optional(),
  PAYMENT_PROVIDER: z.string().optional(),
  PAYMENT_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional()
});

export const serverEnv = serverEnvSchema.parse({
  APP_ENV: process.env.APP_ENV,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
  FIREBASE_STORAGE_EMULATOR_HOST: process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  BOOTSTRAP_OWNER_UID: process.env.BOOTSTRAP_OWNER_UID,
  BOOTSTRAP_OWNER_EMAIL: process.env.BOOTSTRAP_OWNER_EMAIL,
  BOOTSTRAP_OWNER_DISPLAY_NAME: process.env.BOOTSTRAP_OWNER_DISPLAY_NAME,
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
  PAYMENT_SECRET_KEY: process.env.PAYMENT_SECRET_KEY,
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET
});

export function isProductionAppEnv(env = serverEnv) {
  return env.APP_ENV === "production";
}
