import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Role } from "@/lib/permissions/permissions";
import type { CommerceRepository } from "@/lib/commerce/repository";
import type {
  AuditLog,
  Category,
  Collection,
  Concern,
  ContentBlock,
  Customer,
  DeliveryRule,
  InventoryMovement,
  MediaAsset,
  Order,
  Payment,
  PosShift,
  Product,
  ProductType,
  ProductVariant,
  Promotion,
  RawMaterial,
  Routine,
  StaffUser,
  StoreSettings
} from "@/lib/commerce/types";

export class FirestoreCommerceRepository implements CommerceRepository {
  constructor(
    private readonly db: Firestore,
    private readonly tx?: FirebaseFirestore.Transaction
  ) {}

  async listProducts() {
    this.rejectIfTransactional("listProducts");
    const snapshot = await this.db.collection("products").orderBy("title").get();
    return snapshot.docs.map((doc) => readDoc<Product>(doc)).filter(isDefined);
  }

  async getProduct(id: string) {
    const ref = this.db.collection("products").doc(id);
    return readDoc<Product>(this.tx ? await this.tx.get(ref) : await ref.get());
  }

  async saveProduct(product: Product) {
    this.rejectIfTransactional("saveProduct");
    await this.db.collection("products").doc(product.id).set(cleanFirestoreData(product), {
      merge: true
    });
  }

  async deleteProduct(id: string) {
    this.rejectIfTransactional("deleteProduct");
    await this.db.collection("products").doc(id).delete();
  }

  async getVariant(productId: string, variantId: string) {
    const ref = this.variantCollection(productId).doc(variantId);
    return readDoc<ProductVariant>(this.tx ? await this.tx.get(ref) : await ref.get());
  }

  async saveVariant(variant: ProductVariant) {
    const ref = this.variantCollection(variant.productId).doc(variant.id);
    const data = cleanFirestoreData(variant);
    if (this.tx) {
      this.tx.set(ref, data, { merge: true });
    } else {
      await ref.set(data, { merge: true });
    }
  }

  async deleteVariant(productId: string, variantId: string) {
    this.rejectIfTransactional("deleteVariant");
    await this.variantCollection(productId).doc(variantId).delete();
  }

  async listVariants(productId: string) {
    this.rejectIfTransactional("listVariants");
    const snapshot = await this.variantCollection(productId).get();
    return snapshot.docs.map((doc) => readDoc<ProductVariant>(doc)).filter(isDefined);
  }

  /**
   * One collection-group query for every product's variants, instead of the
   * N per-product subcollection queries listVariants would take called in a
   * loop — used wherever the whole catalogue's variants are needed at once
   * (storefront pages, admin catalogue/operations data).
   */
  async listAllVariants() {
    const query = this.db.collectionGroup("variants");
    const snapshot = this.tx ? await this.tx.get(query) : await query.get();
    return snapshot.docs.map((doc) => readDoc<ProductVariant>(doc)).filter(isDefined);
  }

  async listCategories() {
    this.rejectIfTransactional("listCategories");
    const snapshot = await this.db.collection("categories").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<Category>(doc)).filter(isDefined);
  }

  async saveCategory(category: Category) {
    this.rejectIfTransactional("saveCategory");
    await this.db.collection("categories").doc(category.id).set(cleanFirestoreData(category), {
      merge: true
    });
  }

  async listCollections() {
    this.rejectIfTransactional("listCollections");
    const snapshot = await this.db.collection("collections").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<Collection>(doc)).filter(isDefined);
  }

  async saveCollection(collection: Collection) {
    this.rejectIfTransactional("saveCollection");
    await this.db.collection("collections").doc(collection.id).set(cleanFirestoreData(collection), {
      merge: true
    });
  }

  async listConcerns() {
    this.rejectIfTransactional("listConcerns");
    const snapshot = await this.db.collection("concerns").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<Concern>(doc)).filter(isDefined);
  }

  async saveConcern(concern: Concern) {
    this.rejectIfTransactional("saveConcern");
    await this.db.collection("concerns").doc(concern.id).set(cleanFirestoreData(concern), {
      merge: true
    });
  }

  async listProductTypes() {
    this.rejectIfTransactional("listProductTypes");
    const snapshot = await this.db.collection("productTypes").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<ProductType>(doc)).filter(isDefined);
  }

  async saveProductType(productType: ProductType) {
    this.rejectIfTransactional("saveProductType");
    await this.db
      .collection("productTypes")
      .doc(productType.id)
      .set(cleanFirestoreData(productType), { merge: true });
  }

  async listRoutines() {
    this.rejectIfTransactional("listRoutines");
    const snapshot = await this.db.collection("routines").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<Routine>(doc)).filter(isDefined);
  }

  async saveRoutine(routine: Routine) {
    this.rejectIfTransactional("saveRoutine");
    await this.db.collection("routines").doc(routine.id).set(cleanFirestoreData(routine), {
      merge: true
    });
  }

  async listRawMaterials() {
    this.rejectIfTransactional("listRawMaterials");
    const snapshot = await this.db.collection("rawMaterials").orderBy("name").get();
    return snapshot.docs.map((doc) => readDoc<RawMaterial>(doc)).filter(isDefined);
  }

  async getRawMaterial(id: string) {
    this.rejectIfTransactional("getRawMaterial");
    return readDoc<RawMaterial>(await this.db.collection("rawMaterials").doc(id).get());
  }

  async saveRawMaterial(material: RawMaterial) {
    this.rejectIfTransactional("saveRawMaterial");
    await this.db.collection("rawMaterials").doc(material.id).set(cleanFirestoreData(material), {
      merge: true
    });
  }

  async deleteRawMaterial(id: string) {
    this.rejectIfTransactional("deleteRawMaterial");
    await this.db.collection("rawMaterials").doc(id).delete();
  }

  async listMedia() {
    const query = this.db.collection("media");
    const snapshot = this.tx ? await this.tx.get(query) : await query.get();
    return snapshot.docs.map((doc) => readDoc<MediaAsset>(doc)).filter(isDefined);
  }

  async saveMedia(media: MediaAsset) {
    this.rejectIfTransactional("saveMedia");
    await this.db.collection("media").doc(media.id).set(cleanFirestoreData(media), {
      merge: true
    });
  }

  async deleteMedia(id: string) {
    this.rejectIfTransactional("deleteMedia");
    await this.db.collection("media").doc(id).delete();
  }

  async listContentBlocks() {
    this.rejectIfTransactional("listContentBlocks");
    const snapshot = await this.db.collection("contentBlocks").get();
    return snapshot.docs.map((doc) => readDoc<ContentBlock>(doc)).filter(isDefined);
  }

  async saveContentBlock(block: ContentBlock) {
    this.rejectIfTransactional("saveContentBlock");
    await this.db.collection("contentBlocks").doc(block.key).set(cleanFirestoreData(block), {
      merge: true
    });
  }

  async saveCustomer(customer: Customer) {
    this.rejectIfTransactional("saveCustomer");
    await this.db.collection("customers").doc(customer.id).set(cleanFirestoreData(customer), {
      merge: true
    });
  }

  async getCustomer(id: string) {
    this.rejectIfTransactional("getCustomer");
    return readDoc<Customer>(await this.db.collection("customers").doc(id).get());
  }

  async listCustomers() {
    this.rejectIfTransactional("listCustomers");
    const snapshot = await this.db.collection("customers").get();
    return snapshot.docs.map((doc) => readDoc<Customer>(doc)).filter(isDefined);
  }

  async saveOrder(order: Order) {
    const ref = this.db.collection("orders").doc(order.id);
    const data = cleanFirestoreData(order);
    if (this.tx) {
      this.tx.set(ref, data, { merge: true });
    } else {
      await ref.set(data, { merge: true });
    }
  }

  async getOrder(id: string) {
    const ref = this.db.collection("orders").doc(id);
    return readDoc<Order>(this.tx ? await this.tx.get(ref) : await ref.get());
  }

  async listOrders() {
    this.rejectIfTransactional("listOrders");
    const snapshot = await this.db.collection("orders").get();
    return snapshot.docs.map((doc) => readDoc<Order>(doc)).filter(isDefined);
  }

  async deleteOrder(id: string) {
    this.rejectIfTransactional("deleteOrder");
    await this.db.collection("orders").doc(id).delete();
  }

  async findOrderByIdempotencyKey(idempotencyKey: string) {
    const query = this.db.collection("orders").where("idempotencyKey", "==", idempotencyKey).limit(1);
    const snapshot = this.tx ? await this.tx.get(query) : await query.get();

    return snapshot.docs[0] ? readDoc<Order>(snapshot.docs[0]) : null;
  }

  async savePayment(payment: Payment) {
    const ref = this.db.collection("payments").doc(payment.id);
    const data = cleanFirestoreData(payment);
    if (this.tx) {
      this.tx.set(ref, data, { merge: true });
    } else {
      await ref.set(data, { merge: true });
    }
  }

  async listPayments() {
    const query = this.db.collection("payments");
    const snapshot = this.tx ? await this.tx.get(query) : await query.get();
    return snapshot.docs.map((doc) => readDoc<Payment>(doc)).filter(isDefined);
  }

  async deletePayment(id: string) {
    this.rejectIfTransactional("deletePayment");
    await this.db.collection("payments").doc(id).delete();
  }

  async saveInventoryMovement(movement: InventoryMovement) {
    const ref = this.db.collection("inventoryMovements").doc(movement.id);
    const data = cleanFirestoreData(movement);
    if (this.tx) {
      this.tx.set(ref, data, { merge: true });
    } else {
      await ref.set(data, { merge: true });
    }
  }

  async listInventoryMovements(variantId: string) {
    this.rejectIfTransactional("listInventoryMovements");
    const snapshot = await this.db
      .collection("inventoryMovements")
      .where("variantId", "==", variantId)
      .get();

    return snapshot.docs.map((doc) => readDoc<InventoryMovement>(doc)).filter(isDefined);
  }

  /**
   * One query for every variant's movements, instead of the N queries
   * listInventoryMovements would take called per-variant — used by admin
   * pages that need the whole ledger (just Inventory today) rather than a
   * single variant's history.
   */
  async listAllInventoryMovements() {
    this.rejectIfTransactional("listAllInventoryMovements");
    const snapshot = await this.db.collection("inventoryMovements").get();
    return snapshot.docs.map((doc) => readDoc<InventoryMovement>(doc)).filter(isDefined);
  }

  async savePromotion(promotion: Promotion) {
    const ref = this.db.collection("promotions").doc(promotion.id);
    const data = cleanFirestoreData(promotion);
    if (this.tx) {
      this.tx.set(ref, data, { merge: true });
    } else {
      await ref.set(data, { merge: true });
    }
  }

  async listPromotions() {
    const query = this.db.collection("promotions");
    const snapshot = this.tx ? await this.tx.get(query) : await query.get();
    return snapshot.docs.map((doc) => readDoc<Promotion>(doc)).filter(isDefined);
  }

  async saveDeliveryRule(deliveryRule: DeliveryRule) {
    this.rejectIfTransactional("saveDeliveryRule");
    await this.db
      .collection("deliveryRules")
      .doc(deliveryRule.id)
      .set(cleanFirestoreData(deliveryRule), { merge: true });
  }

  async listDeliveryRules() {
    this.rejectIfTransactional("listDeliveryRules");
    const snapshot = await this.db.collection("deliveryRules").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<DeliveryRule>(doc)).filter(isDefined);
  }

  async savePosShift(shift: PosShift) {
    this.rejectIfTransactional("savePosShift");
    await this.db.collection("posShifts").doc(shift.id).set(cleanFirestoreData(shift), {
      merge: true
    });
  }

  async getPosShift(id: string) {
    this.rejectIfTransactional("getPosShift");
    return readDoc<PosShift>(await this.db.collection("posShifts").doc(id).get());
  }

  async listPosShifts() {
    this.rejectIfTransactional("listPosShifts");
    const snapshot = await this.db.collection("posShifts").get();
    return snapshot.docs.map((doc) => readDoc<PosShift>(doc)).filter(isDefined);
  }

  async saveRole(role: Role) {
    this.rejectIfTransactional("saveRole");
    await this.db.collection("roles").doc(role.id).set(cleanFirestoreData(role), {
      merge: true
    });
  }

  async getRole(id: string) {
    const ref = this.db.collection("roles").doc(id);
    return readDoc<Role>(this.tx ? await this.tx.get(ref) : await ref.get());
  }

  async listRoles() {
    this.rejectIfTransactional("listRoles");
    const snapshot = await this.db.collection("roles").get();
    return snapshot.docs.map((doc) => readDoc<Role>(doc)).filter(isDefined);
  }

  async deleteRole(id: string) {
    this.rejectIfTransactional("deleteRole");
    await this.db.collection("roles").doc(id).delete();
  }

  async saveStaffUser(user: StaffUser) {
    this.rejectIfTransactional("saveStaffUser");
    await this.db.collection("users").doc(user.id).set(cleanFirestoreData(user), {
      merge: true
    });
  }

  async getStaffUser(id: string) {
    this.rejectIfTransactional("getStaffUser");
    return readDoc<StaffUser>(await this.db.collection("users").doc(id).get());
  }

  async listStaffUsers() {
    this.rejectIfTransactional("listStaffUsers");
    const snapshot = await this.db.collection("users").get();
    return snapshot.docs.map((doc) => readDoc<StaffUser>(doc)).filter(isDefined);
  }

  async deleteStaffUser(id: string) {
    this.rejectIfTransactional("deleteStaffUser");
    await this.db.collection("users").doc(id).delete();
  }

  async getStoreSettings() {
    this.rejectIfTransactional("getStoreSettings");
    return readDoc<StoreSettings>(await this.db.collection("settings").doc("store").get());
  }

  async saveStoreSettings(settings: StoreSettings) {
    this.rejectIfTransactional("saveStoreSettings");
    await this.db.collection("settings").doc("store").set(cleanFirestoreData(settings), {
      merge: true
    });
  }

  async saveAuditLog(log: AuditLog) {
    const ref = this.db.collection("auditLogs").doc(log.id);
    const data = cleanFirestoreData(log);
    if (this.tx) {
      this.tx.set(ref, data, { merge: true });
    } else {
      await ref.set(data, { merge: true });
    }
  }

  async listAuditLogs() {
    this.rejectIfTransactional("listAuditLogs");
    const snapshot = await this.db.collection("auditLogs").get();
    return snapshot.docs.map((doc) => readDoc<AuditLog>(doc)).filter(isDefined);
  }

  private variantCollection(productId: string) {
    return this.db.collection("products").doc(productId).collection("variants");
  }

  /**
   * Guards every method with no `this.tx` branch: called through a
   * transaction-scoped instance, it would silently read/write outside the
   * transaction instead of failing — this throws instead so a future
   * transactional call site through an unbranched method fails loudly.
   */
  private rejectIfTransactional(method: string) {
    if (this.tx) {
      throw new Error(`FirestoreCommerceRepository.${method} is not transaction-safe — add a tx branch before calling it inside withTransaction.`);
    }
  }
}

function readDoc<T>(snapshot: FirebaseFirestore.DocumentSnapshot) {
  return snapshot.exists ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
}

function cleanFirestoreData(value: unknown): FirebaseFirestore.DocumentData {
  if (Array.isArray(value)) {
    return value.map((item) => cleanFirestoreData(item));
  }

  // Timestamp does NOT extend Date — a value read back from Firestore (e.g. an
  // existing order's createdAt, spread into an update) falls through to the
  // generic object branch below without this check, and Object.entries() on a
  // Timestamp instance yields its private {_seconds, _nanoseconds} fields,
  // silently rewriting it into a dead plain object that never parses as a
  // date again on every future read.
  if (value instanceof Date || value instanceof Timestamp || value === null || typeof value !== "object") {
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
