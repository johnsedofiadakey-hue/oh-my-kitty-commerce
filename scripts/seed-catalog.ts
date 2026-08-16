import { createRequire } from "node:module";
import { Timestamp } from "firebase-admin/firestore";
import {
  sampleCategories,
  sampleCollections,
  sampleDeliveryRules,
  sampleMedia,
  sampleProducts,
  samplePromotions,
  sampleVariants
} from "../src/lib/commerce/sample-data";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd());

async function seedCatalog() {
  if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.SEED_FIRESTORE_CATALOG !== "true") {
    throw new Error(
      "Refusing to seed live Firestore without SEED_FIRESTORE_CATALOG=true. This protects real projects from accidental writes."
    );
  }

  const { getAdminFirestore } = await import("../src/lib/firebase/server");
  const db = getAdminFirestore();
  if (!db) {
    throw new Error("Firebase Admin is unavailable. Check .env.local and Google credentials.");
  }

  const now = Timestamp.now();
  const batch = db.batch();

  for (const category of sampleCategories) {
    batch.set(db.collection("categories").doc(category.id), {
      ...category,
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }

  for (const product of sampleProducts) {
    batch.set(db.collection("products").doc(product.id), {
      ...product,
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }

  for (const variant of sampleVariants) {
    batch.set(
      db.collection("products").doc(variant.productId).collection("variants").doc(variant.id),
      {
        ...variant,
        createdAt: now,
        updatedAt: now
      },
      { merge: true }
    );
  }

  for (const collection of sampleCollections) {
    batch.set(db.collection("collections").doc(collection.id), {
      ...collection,
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }

  for (const media of sampleMedia) {
    batch.set(db.collection("media").doc(media.id), {
      ...media,
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }

  for (const promotion of samplePromotions) {
    batch.set(db.collection("promotions").doc(promotion.id), {
      ...promotion,
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }

  for (const deliveryRule of sampleDeliveryRules) {
    batch.set(db.collection("deliveryRules").doc(deliveryRule.id), {
      ...deliveryRule,
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }

  batch.set(db.collection("siteSettings").doc("public"), {
    storeName: "Oh My Kitty",
    currency: "GHS",
    palette: ["#fffaf7", "#f6b8ae", "#111111", "#50683f"],
    updatedAt: now
  }, { merge: true });

  batch.set(db.collection("auditLogs").doc("seed-catalog"), {
    actorId: "system:seed-catalog",
    action: "seed.catalog",
    entityType: "catalogue",
    entityId: "initial",
    summary: "Seeded starter catalogue, promotions, delivery rules, and public settings.",
    createdAt: now
  }, { merge: true });

  await batch.commit();
  console.log("Seeded starter catalogue data.");
}

seedCatalog().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
