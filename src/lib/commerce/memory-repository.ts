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
  Routine,
  StaffUser,
  StoreSettings
} from "@/lib/commerce/types";

export class MemoryCommerceRepository implements CommerceRepository {
  products = new Map<string, Product>();
  variants = new Map<string, ProductVariant>();
  categories = new Map<string, Category>();
  collections = new Map<string, Collection>();
  concerns = new Map<string, Concern>();
  productTypes = new Map<string, ProductType>();
  routines = new Map<string, Routine>();
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

  async getVariant(productId: string, variantId: string) {
    const variant = this.variants.get(variantKey(productId, variantId));
    return variant ?? null;
  }

  async saveVariant(variant: ProductVariant) {
    this.variants.set(variantKey(variant.productId, variant.id), variant);
  }

  async listVariants(productId: string) {
    return [...this.variants.values()].filter((variant) => variant.productId === productId);
  }

  async listCategories() {
    return [...this.categories.values()].sort((first, second) => first.sortOrder - second.sortOrder);
  }

  async saveCategory(category: Category) {
    this.categories.set(category.id, category);
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

  async findOrderByIdempotencyKey(idempotencyKey: string) {
    return [...this.orders.values()].find((order) => order.idempotencyKey === idempotencyKey) ?? null;
  }

  async savePayment(payment: Payment) {
    this.payments.set(payment.id, payment);
  }

  async listPayments() {
    return [...this.payments.values()];
  }

  async saveInventoryMovement(movement: InventoryMovement) {
    this.inventoryMovements.set(movement.id, movement);
  }

  async listInventoryMovements(variantId: string) {
    return [...this.inventoryMovements.values()].filter(
      (movement) => movement.variantId === variantId
    );
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
}

function variantKey(productId: string, variantId: string) {
  return `${productId}/${variantId}`;
}
