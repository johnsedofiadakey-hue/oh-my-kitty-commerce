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
  RawMaterial,
  RecurringExpenseTemplate,
  Routine,
  StaffUser,
  StoreSettings,
  Worker
} from "@/lib/commerce/types";

export class MemoryCommerceRepository implements CommerceRepository {
  products = new Map<string, Product>();
  variants = new Map<string, ProductVariant>();
  collections = new Map<string, Collection>();
  concerns = new Map<string, Concern>();
  productTypes = new Map<string, ProductType>();
  routines = new Map<string, Routine>();
  rawMaterials = new Map<string, RawMaterial>();
  media = new Map<string, MediaAsset>();
  contentBlocks = new Map<string, ContentBlock>();
  customers = new Map<string, Customer>();
  orders = new Map<string, Order>();
  payments = new Map<string, Payment>();
  inventoryMovements = new Map<string, InventoryMovement>();
  promotions = new Map<string, Promotion>();
  deliveryRules = new Map<string, DeliveryRule>();
  posShifts = new Map<string, PosShift>();
  roles = new Map<string, Role>();
  staffUsers = new Map<string, StaffUser>();
  storeSettings: StoreSettings | null = null;
  auditLogs = new Map<string, AuditLog>();
  pushSubscriptions = new Map<string, PushSubscription>();
  notificationLogs = new Map<string, NotificationLog>();
  expenseCategories = new Map<string, ExpenseCategory>();
  expenses = new Map<string, Expense>();
  recurringExpenseTemplates = new Map<string, RecurringExpenseTemplate>();
  capitalAssets = new Map<string, CapitalAsset>();
  workers = new Map<string, Worker>();
  payrollPayments = new Map<string, PayrollPayment>();
  manualRevenueEntries = new Map<string, ManualRevenueEntry>();

  async listProducts() {
    return [...this.products.values()].sort((first, second) =>
      first.title.localeCompare(second.title)
    );
  }

  async getProduct(id: string) {
    return this.products.get(id) ?? null;
  }

  async saveProduct(product: Product) {
    this.products.set(product.id, product);
  }

  async deleteProduct(id: string) {
    this.products.delete(id);
  }

  async getVariant(productId: string, variantId: string) {
    const variant = this.variants.get(variantKey(productId, variantId));
    return variant ?? null;
  }

  async saveVariant(variant: ProductVariant) {
    this.variants.set(variantKey(variant.productId, variant.id), variant);
  }

  async deleteVariant(productId: string, variantId: string) {
    this.variants.delete(variantKey(productId, variantId));
  }

  async listVariants(productId: string) {
    return [...this.variants.values()].filter((variant) => variant.productId === productId);
  }

  async listAllVariants() {
    return [...this.variants.values()];
  }

  async listCollections() {
    return [...this.collections.values()].sort(
      (first, second) => first.sortOrder - second.sortOrder
    );
  }

  async saveCollection(collection: Collection) {
    this.collections.set(collection.id, collection);
  }

  async listConcerns() {
    return [...this.concerns.values()].sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async saveConcern(concern: Concern) {
    this.concerns.set(concern.id, concern);
  }

  async listProductTypes() {
    return [...this.productTypes.values()].sort(
      (first, second) => first.sortOrder - second.sortOrder
    );
  }

  async saveProductType(productType: ProductType) {
    this.productTypes.set(productType.id, productType);
  }

  async listRoutines() {
    return [...this.routines.values()].sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async saveRoutine(routine: Routine) {
    this.routines.set(routine.id, routine);
  }

  async listRawMaterials() {
    return [...this.rawMaterials.values()].sort((first, second) => first.name.localeCompare(second.name));
  }

  async getRawMaterial(id: string) {
    return this.rawMaterials.get(id) ?? null;
  }

  async saveRawMaterial(material: RawMaterial) {
    this.rawMaterials.set(material.id, material);
  }

  async deleteRawMaterial(id: string) {
    this.rawMaterials.delete(id);
  }

  async listMedia() {
    return [...this.media.values()];
  }

  async saveMedia(media: MediaAsset) {
    this.media.set(media.id, media);
  }

  async deleteMedia(id: string) {
    this.media.delete(id);
  }

  async listContentBlocks() {
    return [...this.contentBlocks.values()];
  }

  async saveContentBlock(block: ContentBlock) {
    this.contentBlocks.set(block.key, block);
  }

  async saveCustomer(customer: Customer) {
    this.customers.set(customer.id, customer);
  }

  async getCustomer(id: string) {
    return this.customers.get(id) ?? null;
  }

  async listCustomers() {
    return [...this.customers.values()];
  }

  async saveOrder(order: Order) {
    this.orders.set(order.id, order);
  }

  async getOrder(id: string) {
    return this.orders.get(id) ?? null;
  }

  async listOrders() {
    return [...this.orders.values()];
  }

  async deleteOrder(id: string) {
    this.orders.delete(id);
  }

  async findOrderByIdempotencyKey(idempotencyKey: string) {
    return [...this.orders.values()].find((order) => order.idempotencyKey === idempotencyKey) ?? null;
  }

  async savePayment(payment: Payment) {
    this.payments.set(payment.id, payment);
  }

  async listPayments() {
    return [...this.payments.values()];
  }

  async deletePayment(id: string) {
    this.payments.delete(id);
  }

  async saveInventoryMovement(movement: InventoryMovement) {
    this.inventoryMovements.set(movement.id, movement);
  }

  async listInventoryMovements(variantId: string) {
    return [...this.inventoryMovements.values()].filter(
      (movement) => movement.variantId === variantId
    );
  }

  async listAllInventoryMovements() {
    return [...this.inventoryMovements.values()];
  }

  async savePromotion(promotion: Promotion) {
    this.promotions.set(promotion.id, promotion);
  }

  async listPromotions() {
    return [...this.promotions.values()];
  }

  async saveDeliveryRule(deliveryRule: DeliveryRule) {
    this.deliveryRules.set(deliveryRule.id, deliveryRule);
  }

  async listDeliveryRules() {
    return [...this.deliveryRules.values()].sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async savePosShift(shift: PosShift) {
    this.posShifts.set(shift.id, shift);
  }

  async getPosShift(id: string) {
    return this.posShifts.get(id) ?? null;
  }

  async listPosShifts() {
    return [...this.posShifts.values()];
  }

  async saveRole(role: Role) {
    this.roles.set(role.id, role);
  }

  async getRole(id: string) {
    return this.roles.get(id) ?? null;
  }

  async listRoles() {
    return [...this.roles.values()];
  }

  async deleteRole(id: string) {
    this.roles.delete(id);
  }

  async saveStaffUser(user: StaffUser) {
    this.staffUsers.set(user.id, user);
  }

  async getStaffUser(id: string) {
    return this.staffUsers.get(id) ?? null;
  }

  async listStaffUsers() {
    return [...this.staffUsers.values()];
  }

  async deleteStaffUser(id: string) {
    this.staffUsers.delete(id);
  }

  async getStoreSettings() {
    return this.storeSettings;
  }

  async saveStoreSettings(settings: StoreSettings) {
    this.storeSettings = settings;
  }

  async saveAuditLog(log: AuditLog) {
    this.auditLogs.set(log.id, log);
  }

  async listAuditLogs() {
    return [...this.auditLogs.values()];
  }

  async savePushSubscription(subscription: PushSubscription) {
    this.pushSubscriptions.set(subscription.id, subscription);
  }

  async listPushSubscriptions() {
    return [...this.pushSubscriptions.values()];
  }

  async deletePushSubscription(id: string) {
    this.pushSubscriptions.delete(id);
  }

  async saveNotificationLog(log: NotificationLog) {
    this.notificationLogs.set(log.id, log);
  }

  async listNotificationLogs() {
    return [...this.notificationLogs.values()].sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime()
    );
  }

  async listExpenseCategories() {
    return [...this.expenseCategories.values()].sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async getExpenseCategory(id: string) {
    return this.expenseCategories.get(id) ?? null;
  }

  async saveExpenseCategory(category: ExpenseCategory) {
    this.expenseCategories.set(category.id, category);
  }

  async listExpenses() {
    return [...this.expenses.values()].sort((first, second) => second.date.getTime() - first.date.getTime());
  }

  async getExpense(id: string) {
    return this.expenses.get(id) ?? null;
  }

  async saveExpense(expense: Expense) {
    this.expenses.set(expense.id, expense);
  }

  async deleteExpense(id: string) {
    this.expenses.delete(id);
  }

  async listRecurringExpenseTemplates() {
    return [...this.recurringExpenseTemplates.values()].sort((first, second) => first.label.localeCompare(second.label));
  }

  async getRecurringExpenseTemplate(id: string) {
    return this.recurringExpenseTemplates.get(id) ?? null;
  }

  async saveRecurringExpenseTemplate(template: RecurringExpenseTemplate) {
    this.recurringExpenseTemplates.set(template.id, template);
  }

  async deleteRecurringExpenseTemplate(id: string) {
    this.recurringExpenseTemplates.delete(id);
  }

  async listCapitalAssets() {
    return [...this.capitalAssets.values()].sort(
      (first, second) => second.purchaseDate.getTime() - first.purchaseDate.getTime()
    );
  }

  async getCapitalAsset(id: string) {
    return this.capitalAssets.get(id) ?? null;
  }

  async saveCapitalAsset(asset: CapitalAsset) {
    this.capitalAssets.set(asset.id, asset);
  }

  async deleteCapitalAsset(id: string) {
    this.capitalAssets.delete(id);
  }

  async listWorkers() {
    return [...this.workers.values()].sort((first, second) => first.name.localeCompare(second.name));
  }

  async getWorker(id: string) {
    return this.workers.get(id) ?? null;
  }

  async saveWorker(worker: Worker) {
    this.workers.set(worker.id, worker);
  }

  async deleteWorker(id: string) {
    this.workers.delete(id);
  }

  async listPayrollPayments() {
    return [...this.payrollPayments.values()].sort(
      (first, second) => second.paidDate.getTime() - first.paidDate.getTime()
    );
  }

  async savePayrollPayment(payment: PayrollPayment) {
    this.payrollPayments.set(payment.id, payment);
  }

  async deletePayrollPayment(id: string) {
    this.payrollPayments.delete(id);
  }

  async listManualRevenueEntries() {
    return [...this.manualRevenueEntries.values()].sort(
      (first, second) => second.date.getTime() - first.date.getTime()
    );
  }

  async saveManualRevenueEntry(entry: ManualRevenueEntry) {
    this.manualRevenueEntries.set(entry.id, entry);
  }

  async deleteManualRevenueEntry(id: string) {
    this.manualRevenueEntries.delete(id);
  }
}

function variantKey(productId: string, variantId: string) {
  return `${productId}/${variantId}`;
}
