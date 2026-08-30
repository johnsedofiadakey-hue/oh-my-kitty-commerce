import type { Metadata } from "next";
import { trackOrder } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { verifyOrderFulfilToken } from "@/lib/admin/quick-action-token";
import { formatFulfilmentStatus, formatMoney } from "@/lib/commerce/format";
import { quickFulfilAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fulfil Order",
  robots: { index: false, follow: false }
};

const STATUS_ACTIONS: { value: string; label: string }[] = [
  { value: "PROCESSING", label: "Mark as Processing" },
  { value: "READY_FOR_PICKUP", label: "Mark Ready for Pickup" },
  { value: "OUT_FOR_DELIVERY", label: "Mark Out for Delivery" },
  { value: "FULFILLED", label: "Mark Delivered / Collected" },
  { value: "CANCELLED", label: "Cancel Order" }
];

type PageProps = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function QuickFulfilPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { token } = await searchParams;
  const decodedOrderNumber = decodeURIComponent(orderNumber);

  const tokenValid = verifyOrderFulfilToken(decodedOrderNumber, token);
  if (!tokenValid) {
    return (
      <main className="quick-fulfil-page">
        <div className="quick-fulfil-card">
          <h1>Link not valid</h1>
          <p>This link has expired or isn&apos;t correct. Open the order from the admin portal instead.</p>
        </div>
      </main>
    );
  }

  const context = getCommerceServerContext();
  const order = context ? await trackOrder(context, decodedOrderNumber) : null;

  if (!order) {
    return (
      <main className="quick-fulfil-page">
        <div className="quick-fulfil-card">
          <h1>Order not found</h1>
          <p>Couldn&apos;t find order {decodedOrderNumber}.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="quick-fulfil-page">
      <div className="quick-fulfil-card">
        <span className="quick-fulfil-kicker">Oh My Kitty</span>
        <h1>{order.orderNumber}</h1>
        <p className="quick-fulfil-customer">{order.customerSnapshot?.name ?? "Walk-in customer"}</p>
        {order.customerSnapshot?.phone ? (
          <a className="quick-fulfil-phone" href={`tel:${order.customerSnapshot.phone}`}>
            {order.customerSnapshot.phone}
          </a>
        ) : null}

        <div className="quick-fulfil-items">
          {order.items.map((item, index) => (
            <div className="quick-fulfil-item" key={index}>
              <span>
                {item.quantity}x {item.productTitle}
              </span>
              <span>{formatMoney(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="quick-fulfil-total">
          <span>Total</span>
          <strong>{formatMoney(order.total)}</strong>
        </div>

        <div className="quick-fulfil-current-status">
          Current status: <strong>{formatFulfilmentStatus(order.fulfilmentStatus)}</strong>
        </div>

        <div className="quick-fulfil-actions">
          {STATUS_ACTIONS.filter((action) => action.value !== order.fulfilmentStatus).map((action) => (
            <form action={quickFulfilAction} key={action.value}>
              <input name="orderNumber" type="hidden" value={order.orderNumber} />
              <input name="token" type="hidden" value={token ?? ""} />
              <input name="fulfilmentStatus" type="hidden" value={action.value} />
              <button
                className={action.value === "CANCELLED" ? "quick-fulfil-button danger" : "quick-fulfil-button"}
                type="submit"
              >
                {action.label}
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
