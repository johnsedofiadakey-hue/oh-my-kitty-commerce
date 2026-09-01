import { redirect } from "next/navigation";
import { CommerceError } from "@/lib/commerce/errors";
import { getEffectiveRoles, type CommerceActor } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { hasPermission } from "@/lib/permissions/permissions";
import { formatMoney } from "@/lib/commerce/format";
import { formatDate, getOrderCustomerName } from "@/lib/admin/sample-admin-data";
import { PrintReceiptButton } from "@/components/pos/print-receipt-button";

export const dynamic = "force-dynamic";

type ReceiptPageParams = { params: Promise<{ orderId: string }> };

export default async function ReceiptPage({ params }: ReceiptPageParams) {
  const { orderId } = await params;

  let actor: CommerceActor;
  try {
    actor = await getRequiredAdminActor();
  } catch {
    redirect("/admin/login");
  }

  const context = getCommerceServerContext();
  if (!context) {
    redirect("/admin");
  }

  const roles = await getEffectiveRoles(context, actor.roleIds);
  if (!hasPermission(roles, actor, "orders.view")) {
    redirect("/admin");
  }

  const order = await context.repo.getOrder(orderId);
  if (!order) {
    return (
      <main className="receipt-page">
        <p>Order not found.</p>
      </main>
    );
  }

  const [payments, storeSettings] = await Promise.all([
    context.repo.listPayments(),
    context.repo.getStoreSettings().catch(() => null)
  ]);
  const payment = payments.find((entry) => entry.orderId === order.id) ?? null;
  const storeName = storeSettings?.storeName ?? "Oh My Kitty";
  const customerName = getOrderCustomerName(order);
  const customerPhone = order.customerSnapshot?.phone;

  return (
    <main className="receipt-page">
      <PrintReceiptButton />
      <div className="receipt-paper">
        <div className="receipt-header">
          <strong>{storeName}</strong>
          <span>Intimate care, made for every version of her.</span>
        </div>
        <div className="receipt-rule" aria-hidden="true" />
        <div className="receipt-meta">
          <div>
            <span>Order</span>
            <span>{order.orderNumber}</span>
          </div>
          <div>
            <span>Date</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div>
            <span>Channel</span>
            <span>{order.channel.replace("_", " ")}</span>
          </div>
          {customerName !== "Walk-in customer" ? (
            <div>
              <span>Customer</span>
              <span>{customerName}</span>
            </div>
          ) : null}
          {customerPhone ? (
            <div>
              <span>Phone</span>
              <span>{customerPhone}</span>
            </div>
          ) : null}
        </div>
        <div className="receipt-rule" aria-hidden="true" />
        <div className="receipt-items">
          {order.items.map((item, index) => (
            <div className="receipt-item" key={index}>
              <div className="receipt-item-line">
                <span>{item.productTitle}</span>
                <span>{formatMoney(item.lineTotal)}</span>
              </div>
              <div className="receipt-item-sub">
                {item.variantTitle} &times; {item.quantity} @ {formatMoney(item.unitPrice)}
              </div>
            </div>
          ))}
        </div>
        <div className="receipt-rule" aria-hidden="true" />
        <div className="receipt-totals">
          <div>
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discountTotal > 0 ? (
            <div>
              <span>Discount</span>
              <span>-{formatMoney(order.discountTotal)}</span>
            </div>
          ) : null}
          {order.deliveryTotal > 0 ? (
            <div>
              <span>Delivery</span>
              <span>{formatMoney(order.deliveryTotal)}</span>
            </div>
          ) : null}
          {order.taxTotal > 0 ? (
            <div>
              <span>Tax</span>
              <span>{formatMoney(order.taxTotal)}</span>
            </div>
          ) : null}
          <div className="receipt-grand-total">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>
        {payment ? (
          <>
            <div className="receipt-rule" aria-hidden="true" />
            <div className="receipt-meta">
              <div>
                <span>Payment</span>
                <span>{payment.method.replace("_", " ")}</span>
              </div>
              <div>
                <span>Status</span>
                <span>{payment.status}</span>
              </div>
            </div>
          </>
        ) : null}
        <div className="receipt-rule" aria-hidden="true" />
        <p className="receipt-footer">{storeSettings?.receiptFooter ?? "Thank you for shopping with us."}</p>
      </div>
    </main>
  );
}
