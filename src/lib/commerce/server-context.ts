import { getAdminFirestore } from "@/lib/firebase/server";
import { FirestoreCommerceRepository } from "@/lib/commerce/firestore-repository";
import type { CommerceContext } from "@/lib/commerce/operations";

export function getCommerceServerContext(): CommerceContext | null {
  const db = getAdminFirestore();

  if (!db) {
    return null;
  }

  return {
    repo: new FirestoreCommerceRepository(db),
    transaction: (operation) => db.runTransaction((tx) => operation(new FirestoreCommerceRepository(db, tx)))
  };
}
