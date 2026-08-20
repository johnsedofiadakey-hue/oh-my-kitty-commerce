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
  PAYSTACK_SECRET_KEY: z.string().optional(),
  ARKESEL_API_KEY: z.string().optional(),
  ARKESEL_SENDER_ID: z.string().optional(),
  ARKESEL_ADMIN_ALERT_PHONE: z.string().optional()
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
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  ARKESEL_API_KEY: process.env.ARKESEL_API_KEY,
  ARKESEL_SENDER_ID: process.env.ARKESEL_SENDER_ID,
  ARKESEL_ADMIN_ALERT_PHONE: process.env.ARKESEL_ADMIN_ALERT_PHONE
});

export function isProductionAppEnv(env = serverEnv) {
  return env.APP_ENV === "production";
}
