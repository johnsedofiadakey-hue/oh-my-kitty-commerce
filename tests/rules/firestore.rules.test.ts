import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

describe("firestore rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "demo-oh-my-kitty",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8")
      }
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "products/active-product"), {
        status: "ACTIVE",
        title: "Active product"
      });
      await setDoc(doc(context.firestore(), "orders/order-1"), {
        channel: "POS",
        status: "PAID"
      });
      await setDoc(doc(context.firestore(), "promotions/promo-1"), {
        code: "WELCOME10",
        active: true
      });
      await setDoc(doc(context.firestore(), "deliveryRules/delivery-1"), {
        name: "Pickup",
        active: true
      });
      await setDoc(doc(context.firestore(), "contentBlocks/whatsapp-number"), {
        key: "whatsapp-number",
        value: "0241448231"
      });
      await setDoc(doc(context.firestore(), "customers/customer-1"), {
        name: "Ama Owusu",
        phone: "0241448231"
      });
      await setDoc(doc(context.firestore(), "auditLogs/audit-1"), {
        action: "products.create"
      });
      await setDoc(doc(context.firestore(), "users/staff-uid-1"), {
        displayName: "Staff One",
        roleIds: ["role-sales-staff"]
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("allows public reads for active products", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "products/active-product")));
  });

  it("blocks public order reads but allows staff", async () => {
    const publicDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(publicDb, "orders/order-1")));

    const staffDb = testEnv.authenticatedContext("staff-1", { isStaff: true }).firestore();
    await assertSucceeds(getDoc(doc(staffDb, "orders/order-1")));
  });

  it("blocks direct client product writes even for an admin-claimed user", async () => {
    const db = testEnv.authenticatedContext("admin", { isAdmin: true }).firestore();
    await assertFails(setDoc(doc(db, "products/active-product"), { status: "ACTIVE" }));
  });

  it("allows public reads for active promotions and delivery rules", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "promotions/promo-1")));
    await assertSucceeds(getDoc(doc(db, "deliveryRules/delivery-1")));
  });

  it("allows anyone to read content blocks but never write them", async () => {
    const publicDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(publicDb, "contentBlocks/whatsapp-number")));

    const staffDb = testEnv.authenticatedContext("staff-1", { isStaff: true }).firestore();
    await assertFails(setDoc(doc(staffDb, "contentBlocks/whatsapp-number"), { value: "hacked" }));
    const adminDb = testEnv.authenticatedContext("admin", { isAdmin: true }).firestore();
    await assertFails(setDoc(doc(adminDb, "contentBlocks/whatsapp-number"), { value: "hacked" }));
  });

  it("protects customer PII from public and non-staff reads, but allows staff", async () => {
    const publicDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(publicDb, "customers/customer-1")));

    const staffDb = testEnv.authenticatedContext("staff-1", { isStaff: true }).firestore();
    await assertSucceeds(getDoc(doc(staffDb, "customers/customer-1")));
  });

  it("restricts audit logs to admins only, not general staff", async () => {
    const staffDb = testEnv.authenticatedContext("staff-1", { isStaff: true }).firestore();
    await assertFails(getDoc(doc(staffDb, "auditLogs/audit-1")));

    const adminDb = testEnv.authenticatedContext("admin", { isAdmin: true }).firestore();
    await assertSucceeds(getDoc(doc(adminDb, "auditLogs/audit-1")));
  });

  it("lets a signed-in user read their own user doc but not someone else's", async () => {
    const ownDb = testEnv.authenticatedContext("staff-uid-1", {}).firestore();
    await assertSucceeds(getDoc(doc(ownDb, "users/staff-uid-1")));

    const otherDb = testEnv.authenticatedContext("staff-uid-2", {}).firestore();
    await assertFails(getDoc(doc(otherDb, "users/staff-uid-1")));
  });

  it("denies reads and writes for any collection with no matching rule", async () => {
    const adminDb = testEnv.authenticatedContext("admin", { isAdmin: true }).firestore();
    await assertFails(getDoc(doc(adminDb, "somethingUnmodeled/doc-1")));
    await assertFails(setDoc(doc(adminDb, "somethingUnmodeled/doc-1"), { x: 1 }));
  });
});
