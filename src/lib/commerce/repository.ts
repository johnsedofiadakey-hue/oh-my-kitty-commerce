import type { Role } from "@/lib/permissions/permissions";
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

export type CommerceRepository = {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  getVariant(productId: string, variantId: string): Promise<ProductVariant | null>;
  saveVariant(variant: ProductVariant): Promise<void>;
  deleteVariant(productId: string, variantId: string): Promise<void>;
  listVariants(productId: string): Promise<ProductVariant[]>;
  listAllVariants(): Promise<ProductVariant[]>;
  listCollections(): Promise<Collection[]>;
  saveCollection(collection: Collection): Promise<void>;
  listConcerns(): Promise<Concern[]>;
  saveConcern(concern: Concern): Promise<void>;
  listProductTypes(): Promise<ProductType[]>;
  saveProductType(productType: ProductType): Promise<void>;
  listRoutines(): Promise<Routine[]>;
  saveRoutine(routine: Routine): Promise<void>;
  listRawMaterials(): Promise<RawMaterial[]>;
  getRawMaterial(id: string): Promise<RawMaterial | null>;
  saveRawMaterial(material: RawMaterial): Promise<void>;
  deleteRawMaterial(id: string): Promise<void>;
  listMaterialPurchases(): Promise<MaterialPurchase[]>;
  saveMaterialPurchase(purchase: MaterialPurchase): Promise<void>;
  deleteMaterialPurchase(id: string): Promise<void>;
  listParcels(): Promise<Parcel[]>;
  getParcel(id: string): Promise<Parcel | null>;
  findParcelsByOrderId(orderId: string): Promise<Parcel[]>;
  saveParcel(parcel: Parcel): Promise<void>;
  listProductionRuns(): Promise<ProductionRun[]>;
  saveProductionRun(run: ProductionRun): Promise<void>;
  listMedia(): Promise<MediaAsset[]>;
  // For the storefront: fetches only the specific media docs a page
  // actually references, instead of scanning the whole library — same
  // result, far fewer reads, and scales with what's live rather than with
  // everything ever uploaded. Returns [] for an empty `ids` array.
  findMediaByIds(ids: string[]): Promise<MediaAsset[]>;
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
  listAllInventoryMovements(): Promise<InventoryMovement[]>;
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
  deleteStaffUser(id: string): Promise<void>;
  getStoreSettings(): Promise<StoreSettings | null>;
  saveStoreSettings(settings: StoreSettings): Promise<void>;
  saveAuditLog(log: AuditLog): Promise<void>;
  listAuditLogs(): Promise<AuditLog[]>;
  savePushSubscription(subscription: PushSubscription): Promise<void>;
  listPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(id: string): Promise<void>;
  saveNotificationLog(log: NotificationLog): Promise<void>;
  listNotificationLogs(): Promise<NotificationLog[]>;
  listExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenseCategory(id: string): Promise<ExpenseCategory | null>;
  saveExpenseCategory(category: ExpenseCategory): Promise<void>;
  listExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | null>;
  saveExpense(expense: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  listRecurringExpenseTemplates(): Promise<RecurringExpenseTemplate[]>;
  getRecurringExpenseTemplate(id: string): Promise<RecurringExpenseTemplate | null>;
  saveRecurringExpenseTemplate(template: RecurringExpenseTemplate): Promise<void>;
  deleteRecurringExpenseTemplate(id: string): Promise<void>;
  listCapitalAssets(): Promise<CapitalAsset[]>;
  getCapitalAsset(id: string): Promise<CapitalAsset | null>;
  saveCapitalAsset(asset: CapitalAsset): Promise<void>;
  deleteCapitalAsset(id: string): Promise<void>;
  listWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | null>;
  saveWorker(worker: Worker): Promise<void>;
  deleteWorker(id: string): Promise<void>;
  listPayrollPayments(): Promise<PayrollPayment[]>;
  savePayrollPayment(payment: PayrollPayment): Promise<void>;
  deletePayrollPayment(id: string): Promise<void>;
  listManualRevenueEntries(): Promise<ManualRevenueEntry[]>;
  saveManualRevenueEntry(entry: ManualRevenueEntry): Promise<void>;
  deleteManualRevenueEntry(id: string): Promise<void>;
};

export type CommerceTransaction = <T>(operation: (repo: CommerceRepository) => Promise<T>) => Promise<T>;

export function createNoopTransaction(repo: CommerceRepository): CommerceTransaction {
  return (operation) => operation(repo);
}
