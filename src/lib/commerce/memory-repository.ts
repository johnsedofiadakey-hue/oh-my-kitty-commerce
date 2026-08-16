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

export class MemoryCommerceRepository implements CommerceRepository {
  products = new Map<string, Product>();
  variants = new Map<string, ProductVariant>();
  categories = new Map<string, Category>();
  collections = new Map<string, Collection>();
  media = new Map<string, MediaAsset>();
  customers = new Map<string, Customer>();
  orders = new Map<string, Order>();
  payments = new Map<string, Payment>();
  inventoryMovements = new Map<string, InventoryMovement>();
  promotions = new Map<string, Promotion>();
  deliveryRules = new Map<string, DeliveryRule>();
  posShifts = new Map<string, PosShift>();
  roles = new Map<string, Role>();
  auditLogs = new Map<string, AuditLog>();

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

  async saveCategory(category: Category) {
    this.categories.set(category.id, category);
  }

  async saveCollection(collection: Collection) {
    this.collections.set(collection.id, collection);
  }

  async saveMedia(media: MediaAsset) {
    this.media.set(media.id, media);
  }

  async saveCustomer(customer: Customer) {
    this.customers.set(customer.id, customer);
  }

  async getCustomer(id: string) {
    return this.customers.get(id) ?? null;
  }

  async saveOrder(order: Order) {
    this.orders.set(order.id, order);
  }

  async getOrder(id: string) {
    return this.orders.get(id) ?? null;
  }

  async findOrderByIdempotencyKey(idempotencyKey: string) {
    return [...this.orders.values()].find((order) => order.idempotencyKey === idempotencyKey) ?? null;
  }

  async savePayment(payment: Payment) {
    this.payments.set(payment.id, payment);
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

  async saveDeliveryRule(deliveryRule: DeliveryRule) {
    this.deliveryRules.set(deliveryRule.id, deliveryRule);
  }

  async savePosShift(shift: PosShift) {
    this.posShifts.set(shift.id, shift);
  }

  async getPosShift(id: string) {
    return this.posShifts.get(id) ?? null;
  }

  async saveRole(role: Role) {
    this.roles.set(role.id, role);
  }

  async getRole(id: string) {
    return this.roles.get(id) ?? null;
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
