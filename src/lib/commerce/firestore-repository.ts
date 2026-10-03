import { FieldPath, Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Role } from "@/lib/permissions/permissions";
import type { CommerceRepository } from "@/lib/commerce/repository";
import type {
  AuditLog,
  CapitalAsset,
  Collection,
  Concern,
  ContentBlock,
  Customer,
  DeliveryRule,
  Expense,
  ExpenseCategory,
  InventoryMovement,
  ManualRevenueEntry,
  MediaAsset,
  NotificationLog,
  Order,
  PayrollPayment,
  Payment,
  PosShift,
  Product,
  ProductType,
  ProductVariant,
  Promotion,
  PushSubscription,
  MaterialPurchase,
  Parcel,
  ProductionRun,
  RawMaterial,
  RecurringExpenseTemplate,
  Routine,
  StaffUser,
  StoreSettings,
  Worker
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

  async listMaterialPurchases() {
    this.rejectIfTransactional("listMaterialPurchases");
    const snapshot = await this.db.collection("materialPurchases").orderBy("date", "desc").limit(500).get();
    return snapshot.docs.map((doc) => readDoc<MaterialPurchase>(doc)).filter(isDefined);
  }

  async saveMaterialPurchase(purchase: MaterialPurchase) {
    this.rejectIfTransactional("saveMaterialPurchase");
    await this.db.collection("materialPurchases").doc(purchase.id).set(cleanFirestoreData(purchase), {
      merge: true
    });
  }

  async deleteMaterialPurchase(id: string) {
    this.rejectIfTransactional("deleteMaterialPurchase");
    await this.db.collection("materialPurchases").doc(id).delete();
  }

  async listParcels() {
    this.rejectIfTransactional("listParcels");
    const snapshot = await this.db.collection("parcels").orderBy("packedAt", "desc").limit(500).get();
    return snapshot.docs.map((doc) => readDoc<Parcel>(doc)).filter(isDefined);
  }

  async getParcel(id: string) {
    this.rejectIfTransactional("getParcel");
    return readDoc<Parcel>(await this.db.collection("parcels").doc(id).get());
  }

  async findParcelsByOrderId(orderId: string) {
    this.rejectIfTransactional("findParcelsByOrderId");
    const snapshot = await this.db.collection("parcels").where("orderId", "==", orderId).get();
    return snapshot.docs.map((doc) => readDoc<Parcel>(doc)).filter(isDefined);
  }

  async saveParcel(parcel: Parcel) {
    this.rejectIfTransactional("saveParcel");
    await this.db.collection("parcels").doc(parcel.id).set(cleanFirestoreData(parcel), { merge: true });
  }

  async listProductionRuns() {
    this.rejectIfTransactional("listProductionRuns");
    const snapshot = await this.db.collection("productionRuns").orderBy("createdAt", "desc").limit(500).get();
    return snapshot.docs.map((doc) => readDoc<ProductionRun>(doc)).filter(isDefined);
  }

  async saveProductionRun(run: ProductionRun) {
    this.rejectIfTransactional("saveProductionRun");
    await this.db.collection("productionRuns").doc(run.id).set(cleanFirestoreData(run), { merge: true });
  }

  async listMedia() {
    const query = this.db.collection("media");
    const snapshot = this.tx ? await this.tx.get(query) : await query.get();
    return snapshot.docs.map((doc) => readDoc<MediaAsset>(doc)).filter(isDefined);
  }

  async findMediaByIds(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      return [];
    }

    // Firestore's "in" operator caps out at 30 values per query.
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 30) {
      chunks.push(unique.slice(i, i + 30));
    }

    const snapshots = await Promise.all(
      chunks.map((chunk) => {
        const query = this.db.collection("media").where(FieldPath.documentId(), "in", chunk);
        return this.tx ? this.tx.get(query) : query.get();
      })
    );

    return snapshots.flatMap((snapshot) => snapshot.docs.map((doc) => readDoc<MediaAsset>(doc)).filter(isDefined));
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

  async getInventoryMovement(id: string) {
    const ref = this.db.collection("inventoryMovements").doc(id);
    return readDoc<InventoryMovement>(this.tx ? await this.tx.get(ref) : await ref.get());
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
    // The newest 500 across *all* variants, shared by every admin page. It is
    // not a per-variant history — the Inventory page reads each variant's own
    // movements with listInventoryMovements instead.
    const snapshot = await this.db.collection("inventoryMovements").orderBy("createdAt", "desc").limit(500).get();
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
    // Pure display (the Audit page), unbounded otherwise — every admin
    // action ever taken writes one of these, so this grows forever without
    // a cap. 300 is generous for "what happened recently."
    const snapshot = await this.db.collection("auditLogs").orderBy("createdAt", "desc").limit(300).get();
    return snapshot.docs.map((doc) => readDoc<AuditLog>(doc)).filter(isDefined);
  }

  async savePushSubscription(subscription: PushSubscription) {
    this.rejectIfTransactional("savePushSubscription");
    await this.db.collection("pushSubscriptions").doc(subscription.id).set(cleanFirestoreData(subscription), {
      merge: true
    });
  }

  async listPushSubscriptions() {
    this.rejectIfTransactional("listPushSubscriptions");
    const snapshot = await this.db.collection("pushSubscriptions").get();
    return snapshot.docs.map((doc) => readDoc<PushSubscription>(doc)).filter(isDefined);
  }

  async deletePushSubscription(id: string) {
    this.rejectIfTransactional("deletePushSubscription");
    await this.db.collection("pushSubscriptions").doc(id).delete();
  }

  async saveNotificationLog(log: NotificationLog) {
    this.rejectIfTransactional("saveNotificationLog");
    await this.db.collection("notificationLogs").doc(log.id).set(cleanFirestoreData(log), {
      merge: true
    });
  }

  async listNotificationLogs() {
    this.rejectIfTransactional("listNotificationLogs");
    const snapshot = await this.db.collection("notificationLogs").orderBy("createdAt", "desc").limit(100).get();
    return snapshot.docs.map((doc) => readDoc<NotificationLog>(doc)).filter(isDefined);
  }

  async listExpenseCategories() {
    this.rejectIfTransactional("listExpenseCategories");
    const snapshot = await this.db.collection("expenseCategories").orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => readDoc<ExpenseCategory>(doc)).filter(isDefined);
  }

  async getExpenseCategory(id: string) {
    this.rejectIfTransactional("getExpenseCategory");
    return readDoc<ExpenseCategory>(await this.db.collection("expenseCategories").doc(id).get());
  }

  async saveExpenseCategory(category: ExpenseCategory) {
    this.rejectIfTransactional("saveExpenseCategory");
    await this.db.collection("expenseCategories").doc(category.id).set(cleanFirestoreData(category), {
      merge: true
    });
  }

  async listExpenses() {
    this.rejectIfTransactional("listExpenses");
    const snapshot = await this.db.collection("expenses").orderBy("date", "desc").get();
    return snapshot.docs.map((doc) => readDoc<Expense>(doc)).filter(isDefined);
  }

  async getExpense(id: string) {
    this.rejectIfTransactional("getExpense");
    return readDoc<Expense>(await this.db.collection("expenses").doc(id).get());
  }

  async saveExpense(expense: Expense) {
    this.rejectIfTransactional("saveExpense");
    await this.db.collection("expenses").doc(expense.id).set(cleanFirestoreData(expense), {
      merge: true
    });
  }

  async deleteExpense(id: string) {
    this.rejectIfTransactional("deleteExpense");
    await this.db.collection("expenses").doc(id).delete();
  }

  async listRecurringExpenseTemplates() {
    this.rejectIfTransactional("listRecurringExpenseTemplates");
    const snapshot = await this.db.collection("recurringExpenseTemplates").orderBy("label").get();
    return snapshot.docs.map((doc) => readDoc<RecurringExpenseTemplate>(doc)).filter(isDefined);
  }

  async getRecurringExpenseTemplate(id: string) {
    this.rejectIfTransactional("getRecurringExpenseTemplate");
    return readDoc<RecurringExpenseTemplate>(await this.db.collection("recurringExpenseTemplates").doc(id).get());
  }

  async saveRecurringExpenseTemplate(template: RecurringExpenseTemplate) {
    this.rejectIfTransactional("saveRecurringExpenseTemplate");
    await this.db.collection("recurringExpenseTemplates").doc(template.id).set(cleanFirestoreData(template), {
      merge: true
    });
  }

  async deleteRecurringExpenseTemplate(id: string) {
    this.rejectIfTransactional("deleteRecurringExpenseTemplate");
    await this.db.collection("recurringExpenseTemplates").doc(id).delete();
  }

  async listCapitalAssets() {
    this.rejectIfTransactional("listCapitalAssets");
    const snapshot = await this.db.collection("capitalAssets").orderBy("purchaseDate", "desc").get();
    return snapshot.docs.map((doc) => readDoc<CapitalAsset>(doc)).filter(isDefined);
  }

  async getCapitalAsset(id: string) {
    this.rejectIfTransactional("getCapitalAsset");
    return readDoc<CapitalAsset>(await this.db.collection("capitalAssets").doc(id).get());
  }

  async saveCapitalAsset(asset: CapitalAsset) {
    this.rejectIfTransactional("saveCapitalAsset");
    await this.db.collection("capitalAssets").doc(asset.id).set(cleanFirestoreData(asset), {
      merge: true
    });
  }

  async deleteCapitalAsset(id: string) {
    this.rejectIfTransactional("deleteCapitalAsset");
    await this.db.collection("capitalAssets").doc(id).delete();
  }

  async listWorkers() {
    this.rejectIfTransactional("listWorkers");
    const snapshot = await this.db.collection("workers").orderBy("name").get();
    return snapshot.docs.map((doc) => readDoc<Worker>(doc)).filter(isDefined);
  }

  async getWorker(id: string) {
    this.rejectIfTransactional("getWorker");
    return readDoc<Worker>(await this.db.collection("workers").doc(id).get());
  }

  async saveWorker(worker: Worker) {
    this.rejectIfTransactional("saveWorker");
    await this.db.collection("workers").doc(worker.id).set(cleanFirestoreData(worker), {
      merge: true
    });
  }

  async deleteWorker(id: string) {
    this.rejectIfTransactional("deleteWorker");
    await this.db.collection("workers").doc(id).delete();
  }

  async listPayrollPayments() {
    this.rejectIfTransactional("listPayrollPayments");
    const snapshot = await this.db.collection("payrollPayments").orderBy("paidDate", "desc").get();
    return snapshot.docs.map((doc) => readDoc<PayrollPayment>(doc)).filter(isDefined);
  }

  async savePayrollPayment(payment: PayrollPayment) {
    this.rejectIfTransactional("savePayrollPayment");
    await this.db.collection("payrollPayments").doc(payment.id).set(cleanFirestoreData(payment), {
      merge: true
    });
  }

  async deletePayrollPayment(id: string) {
    this.rejectIfTransactional("deletePayrollPayment");
    await this.db.collection("payrollPayments").doc(id).delete();
  }

  async listManualRevenueEntries() {
    this.rejectIfTransactional("listManualRevenueEntries");
    const snapshot = await this.db.collection("manualRevenueEntries").orderBy("date", "desc").get();
    return snapshot.docs.map((doc) => readDoc<ManualRevenueEntry>(doc)).filter(isDefined);
  }

  async saveManualRevenueEntry(entry: ManualRevenueEntry) {
    this.rejectIfTransactional("saveManualRevenueEntry");
    await this.db.collection("manualRevenueEntries").doc(entry.id).set(cleanFirestoreData(entry), {
      merge: true
    });
  }

  async deleteManualRevenueEntry(id: string) {
    this.rejectIfTransactional("deleteManualRevenueEntry");
    await this.db.collection("manualRevenueEntries").doc(id).delete();
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
