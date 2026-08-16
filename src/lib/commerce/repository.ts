import type { Role } from "@/lib/permissions/permissions";
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

export type CommerceRepository = {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<void>;
  getVariant(productId: string, variantId: string): Promise<ProductVariant | null>;
  saveVariant(variant: ProductVariant): Promise<void>;
  listVariants(productId: string): Promise<ProductVariant[]>;
  saveCategory(category: Category): Promise<void>;
  saveCollection(collection: Collection): Promise<void>;
  saveMedia(media: MediaAsset): Promise<void>;
  saveCustomer(customer: Customer): Promise<void>;
  getCustomer(id: string): Promise<Customer | null>;
  saveOrder(order: Order): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  findOrderByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
  savePayment(payment: Payment): Promise<void>;
  saveInventoryMovement(movement: InventoryMovement): Promise<void>;
  listInventoryMovements(variantId: string): Promise<InventoryMovement[]>;
  savePromotion(promotion: Promotion): Promise<void>;
  saveDeliveryRule(deliveryRule: DeliveryRule): Promise<void>;
  savePosShift(shift: PosShift): Promise<void>;
  getPosShift(id: string): Promise<PosShift | null>;
  saveRole(role: Role): Promise<void>;
  getRole(id: string): Promise<Role | null>;
  saveAuditLog(log: AuditLog): Promise<void>;
  listAuditLogs(): Promise<AuditLog[]>;
};

export type CommerceTransaction = <T>(operation: () => Promise<T>) => Promise<T>;

export function createNoopTransaction(): CommerceTransaction {
  return (operation) => operation();
}
