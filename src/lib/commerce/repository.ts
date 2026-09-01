import type { Role } from "@/lib/permissions/permissions";
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

export type CommerceRepository = {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  getVariant(productId: string, variantId: string): Promise<ProductVariant | null>;
  saveVariant(variant: ProductVariant): Promise<void>;
  deleteVariant(productId: string, variantId: string): Promise<void>;
  listVariants(productId: string): Promise<ProductVariant[]>;
  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;
  listCollections(): Promise<Collection[]>;
  saveCollection(collection: Collection): Promise<void>;
  listConcerns(): Promise<Concern[]>;
  saveConcern(concern: Concern): Promise<void>;
  listProductTypes(): Promise<ProductType[]>;
  saveProductType(productType: ProductType): Promise<void>;
  listRoutines(): Promise<Routine[]>;
  saveRoutine(routine: Routine): Promise<void>;
  listMedia(): Promise<MediaAsset[]>;
  saveMedia(media: MediaAsset): Promise<void>;
  deleteMedia(id: string): Promise<void>;
  listContentBlocks(): Promise<ContentBlock[]>;
  saveContentBlock(block: ContentBlock): Promise<void>;
  saveCustomer(customer: Customer): Promise<void>;
  getCustomer(id: string): Promise<Customer | null>;
  listCustomers(): Promise<Customer[]>;
  saveOrder(order: Order): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  listOrders(): Promise<Order[]>;
  deleteOrder(id: string): Promise<void>;
  findOrderByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
  savePayment(payment: Payment): Promise<void>;
  listPayments(): Promise<Payment[]>;
  deletePayment(id: string): Promise<void>;
  saveInventoryMovement(movement: InventoryMovement): Promise<void>;
  listInventoryMovements(variantId: string): Promise<InventoryMovement[]>;
  savePromotion(promotion: Promotion): Promise<void>;
  listPromotions(): Promise<Promotion[]>;
  saveDeliveryRule(deliveryRule: DeliveryRule): Promise<void>;
  listDeliveryRules(): Promise<DeliveryRule[]>;
  savePosShift(shift: PosShift): Promise<void>;
  getPosShift(id: string): Promise<PosShift | null>;
  listPosShifts(): Promise<PosShift[]>;
  saveRole(role: Role): Promise<void>;
  getRole(id: string): Promise<Role | null>;
  listRoles(): Promise<Role[]>;
  deleteRole(id: string): Promise<void>;
  saveStaffUser(user: StaffUser): Promise<void>;
  getStaffUser(id: string): Promise<StaffUser | null>;
  listStaffUsers(): Promise<StaffUser[]>;
  getStoreSettings(): Promise<StoreSettings | null>;
  saveStoreSettings(settings: StoreSettings): Promise<void>;
  saveAuditLog(log: AuditLog): Promise<void>;
  listAuditLogs(): Promise<AuditLog[]>;
};

export type CommerceTransaction = <T>(operation: () => Promise<T>) => Promise<T>;

export function createNoopTransaction(): CommerceTransaction {
  return (operation) => operation();
}
