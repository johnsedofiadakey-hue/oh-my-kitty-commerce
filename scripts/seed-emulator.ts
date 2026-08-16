import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { defaultRoles } from "../src/lib/permissions/permissions";
import { sampleCategories, sampleProducts, sampleVariants } from "../src/lib/commerce/sample-data";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-oh-my-kitty";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}

if (getApps().length === 0) {
  initializeApp({
    projectId
  });
}

const db = getFirestore();

async function seed() {
  const now = Timestamp.now();
  const batch = db.batch();

  for (const category of sampleCategories) {
    batch.set(db.collection("categories").doc(category.id), {
      ...category,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const product of sampleProducts) {
    batch.set(db.collection("products").doc(product.id), {
      ...product,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const variant of sampleVariants) {
    batch.set(
      db.collection("products").doc(variant.productId).collection("variants").doc(variant.id),
      {
        ...variant,
        createdAt: now,
        updatedAt: now
      }
    );
  }

  for (const role of defaultRoles) {
    batch.set(db.collection("roles").doc(role.id), {
      ...role,
      createdAt: now,
      updatedAt: now
    });
  }

  batch.set(db.collection("siteSettings").doc("public"), {
    storeName: "Oh My Kitty",
    currency: "GHS",
    palette: ["#fffaf7", "#f6b8ae", "#111111", "#50683f"],
    createdAt: now,
    updatedAt: now
  });

  await batch.commit();
  console.log(`Seeded ${projectId} emulator data.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
