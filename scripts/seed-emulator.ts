import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  sampleAuditLogs,
  sampleCategories,
  sampleCollections,
  sampleCustomers,
  sampleDeliveryRules,
  sampleInventoryMovements,
  sampleMedia,
  sampleOrders,
  samplePayments,
  samplePosShifts,
  sampleProducts,
  samplePromotions,
  sampleRoles,
  sampleUsers,
  sampleVariants
} from "../src/lib/commerce/sample-data";

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

  for (const collection of sampleCollections) {
    batch.set(db.collection("collections").doc(collection.id), {
      ...collection,
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

  for (const media of sampleMedia) {
    batch.set(db.collection("media").doc(media.id), {
      ...media,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const customer of sampleCustomers) {
    batch.set(db.collection("customers").doc(customer.id), {
      ...customer,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const order of sampleOrders) {
    batch.set(db.collection("orders").doc(order.id), {
      ...order,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const payment of samplePayments) {
    batch.set(db.collection("payments").doc(payment.id), {
      ...payment,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const movement of sampleInventoryMovements) {
    batch.set(db.collection("inventoryMovements").doc(movement.id), {
      ...movement,
      createdAt: now
    });
  }

  for (const promotion of samplePromotions) {
    batch.set(db.collection("promotions").doc(promotion.id), {
      ...promotion,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const deliveryRule of sampleDeliveryRules) {
    batch.set(db.collection("deliveryRules").doc(deliveryRule.id), {
      ...deliveryRule,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const shift of samplePosShifts) {
    batch.set(db.collection("posShifts").doc(shift.id), {
      ...shift,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const role of sampleRoles) {
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

  for (const user of sampleUsers) {
    batch.set(db.collection("users").doc(user.uid), {
      ...user,
      createdAt: now,
      updatedAt: now
    });
  }

  batch.set(db.collection("auditLogs").doc("audit-seed"), {
    actorId: "system:seed",
    action: "seed.emulator",
    entityType: "project",
    entityId: projectId,
    summary: "Seeded Phase 1 emulator data",
    createdAt: now
  });

  for (const log of sampleAuditLogs) {
    batch.set(db.collection("auditLogs").doc(log.id), {
      ...log,
      createdAt: Timestamp.fromDate(log.createdAt)
    });
  }

  await batch.commit();
  console.log(`Seeded ${projectId} emulator data.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
