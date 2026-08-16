import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("allows public reads for active products", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "products/active-product")));
  });

  it("blocks public order reads", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "orders/order-1")));
  });

  it("blocks direct client product writes", async () => {
    const db = testEnv.authenticatedContext("admin", { isAdmin: true }).firestore();
    await expect(assertFails(setDoc(doc(db, "products/active-product"), { status: "ACTIVE" })))
      .resolves;
  });
});
