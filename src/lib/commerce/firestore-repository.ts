import type { Firestore } from "firebase-admin/firestore";
import type { Role } from "@/lib/permissions/permissions";
import type { CommerceRepository } from "@/lib/commerce/repository";
import type {
  AuditLog,
  Category,
  Collection,
  Customer,
  DeliveryRule,
  InventoryMovement,
  MediaAsset,
  Order,
  Payment,
  PosShift,
  Product,
  ProductVariant,
  Promotion
} from "@/lib/commerce/types";

export class FirestoreCommerceRepository implements CommerceRepository {
  constructor(private readonly db: Firestore) {}

  async listProducts() {
    const snapshot = await this.db.collection("products").orderBy("title").get();
    return snapshot.docs.map((doc) => readDoc<Product>(doc)).filter(isDefined);
  }

  async getProduct(id: string) {
    return readDoc<Product>(await this.db.collection("products").doc(id).get());
  }

  async saveProduct(product: Product) {
    await this.db.collection("products").doc(product.id).set(cleanFirestoreData(product), {
      merge: true
    });
  }

  async getVariant(productId: string, variantId: string) {
    return readDoc<ProductVariant>(
      await this.variantCollection(productId).doc(variantId).get()
    );
  }

  async saveVariant(variant: ProductVariant) {
    await this.variantCollection(variant.productId).doc(variant.id).set(cleanFirestoreData(variant), {
      merge: true
    });
  }

  async listVariants(productId: string) {
    const snapshot = await this.variantCollection(productId).get();
    return snapshot.docs.map((doc) => readDoc<ProductVariant>(doc)).filter(isDefined);
  }

  async listCategories() {
    const snapshot = await this.db.collection("categories").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<Category>(doc)).filter(isDefined);
  }

  async saveCategory(category: Category) {
    await this.db.collection("categories").doc(category.id).set(cleanFirestoreData(category), {
      merge: true
    });
  }

  async listCollections() {
    const snapshot = await this.db.collection("collections").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<Collection>(doc)).filter(isDefined);
  }

  async saveCollection(collection: Collection) {
    await this.db.collection("collections").doc(collection.id).set(cleanFirestoreData(collection), {
      merge: true
    });
  }

  async listMedia() {
    const snapshot = await this.db.collection("media").get();
    return snapshot.docs.map((doc) => readDoc<MediaAsset>(doc)).filter(isDefined);
  }

  async saveMedia(media: MediaAsset) {
    await this.db.collection("media").doc(media.id).set(cleanFirestoreData(media), {
      merge: true
    });
  }

  async saveCustomer(customer: Customer) {
    await this.db.collection("customers").doc(customer.id).set(cleanFirestoreData(customer), {
      merge: true
    });
  }

  async getCustomer(id: string) {
    return readDoc<Customer>(await this.db.collection("customers").doc(id).get());
  }

  async saveOrder(order: Order) {
    await this.db.collection("orders").doc(order.id).set(cleanFirestoreData(order), {
      merge: true
    });
  }

  async getOrder(id: string) {
    return readDoc<Order>(await this.db.collection("orders").doc(id).get());
  }

  async findOrderByIdempotencyKey(idempotencyKey: string) {
    const snapshot = await this.db
      .collection("orders")
      .where("idempotencyKey", "==", idempotencyKey)
      .limit(1)
      .get();

    return snapshot.docs[0] ? readDoc<Order>(snapshot.docs[0]) : null;
  }

  async savePayment(payment: Payment) {
    await this.db.collection("payments").doc(payment.id).set(cleanFirestoreData(payment), {
      merge: true
    });
  }

  async saveInventoryMovement(movement: InventoryMovement) {
    await this.db
      .collection("inventoryMovements")
      .doc(movement.id)
      .set(cleanFirestoreData(movement), { merge: true });
  }

  async listInventoryMovements(variantId: string) {
    const snapshot = await this.db
      .collection("inventoryMovements")
      .where("variantId", "==", variantId)
      .get();

    return snapshot.docs.map((doc) => readDoc<InventoryMovement>(doc)).filter(isDefined);
  }

  async savePromotion(promotion: Promotion) {
    await this.db.collection("promotions").doc(promotion.id).set(cleanFirestoreData(promotion), {
      merge: true
    });
  }

  async saveDeliveryRule(deliveryRule: DeliveryRule) {
    await this.db
      .collection("deliveryRules")
      .doc(deliveryRule.id)
      .set(cleanFirestoreData(deliveryRule), { merge: true });
  }

  async savePosShift(shift: PosShift) {
    await this.db.collection("posShifts").doc(shift.id).set(cleanFirestoreData(shift), {
      merge: true
    });
  }

  async getPosShift(id: string) {
    return readDoc<PosShift>(await this.db.collection("posShifts").doc(id).get());
  }

  async saveRole(role: Role) {
    await this.db.collection("roles").doc(role.id).set(cleanFirestoreData(role), {
      merge: true
    });
  }

  async getRole(id: string) {
    return readDoc<Role>(await this.db.collection("roles").doc(id).get());
  }

  async saveAuditLog(log: AuditLog) {
    await this.db.collection("auditLogs").doc(log.id).set(cleanFirestoreData(log), {
      merge: true
    });
  }

  async listAuditLogs() {
    const snapshot = await this.db.collection("auditLogs").get();
    return snapshot.docs.map((doc) => readDoc<AuditLog>(doc)).filter(isDefined);
  }

  private variantCollection(productId: string) {
    return this.db.collection("products").doc(productId).collection("variants");
  }
}

function readDoc<T>(snapshot: FirebaseFirestore.DocumentSnapshot) {
  return snapshot.exists ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
}

function cleanFirestoreData(value: unknown): FirebaseFirestore.DocumentData {
  if (Array.isArray(value)) {
    return value.map((item) => cleanFirestoreData(item));
  }

  if (value instanceof Date || value === null || typeof value !== "object") {
    return value as FirebaseFirestore.DocumentData;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, cleanFirestoreData(entryValue)])
  );
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}
