import { ReceiptPageSize, estimateReceiptHeightMm } from "@/components/admin/receipt-page-size";
import type { Metadata, Route } from "next";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { PrintPageButton } from "@/components/admin/print-page-button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Packing Slip",
  robots: { index: false, follow: false }
};

type PageProps = {
  params: Promise<{ parcelId: string }>;
};

/**
 * The slip that gets taped to the parcel. It is the pick list first and the
 * label second — whoever is packing works down it, then it stays on the box as
 * the visible marker that this order is already done.
 *
 * Prints on the same 80mm thermal roll as receipts, via the named @page rule
 * so it doesn't disturb the full-width financial statements.
 */
export default async function PackingSlipPage({ params }: PageProps) {
  const { parcelId } = await params;
  await getRequiredAdminActor();

  const context = getCommerceServerContext();
  const parcel = context ? await context.repo.getParcel(parcelId) : null;
  if (!parcel) {
    redirect("/admin/dispatch" as Route);
  }

  const storeSettings = context ? await context.repo.getStoreSettings().catch(() => null) : null;
  const storeName = storeSettings?.storeName ?? "Oh My Kitty";
  const packedAt = new Date(parcel.packedAt);
  const totalItems = parcel.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="receipt-page packing-slip-page">
      <ReceiptPageSize heightMm={estimateReceiptHeightMm(parcel.items.length, 6)} />
      <PrintPageButton label="Print slip" />
      <div className="receipt-paper">
        <div className="receipt-header">
          <strong>{storeName}</strong>
          <span>Packing slip</span>
        </div>

        <div className="receipt-rule" aria-hidden="true" />

        <div className="receipt-meta">
          <div>
            <span>Parcel</span>
            <strong>{parcel.parcelNumber}</strong>
          </div>
          <div>
            <span>Order</span>
            <strong>{parcel.orderNumber}</strong>
          </div>
          <div>
            <span>Packed</span>
            <span>{packedAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div>
            <span>By</span>
            <span>{parcel.packedByName ?? "staff"}</span>
          </div>
        </div>

        <div className="receipt-rule" aria-hidden="true" />

        <div className="receipt-meta">
          <div>
            <span>To</span>
            <strong>{parcel.customerName ?? "Customer"}</strong>
          </div>
          {parcel.customerPhone ? (
            <div>
              <span>Phone</span>
              <span>{parcel.customerPhone}</span>
            </div>
          ) : null}
          {parcel.customerAddress ? (
            <div>
              <span>Location</span>
              <span>{parcel.customerAddress}</span>
            </div>
          ) : null}
          {parcel.deliveryMethodName ? (
            <div>
              <span>Method</span>
              <span>{parcel.deliveryMethodName}</span>
            </div>
          ) : null}
        </div>

        <div className="receipt-rule" aria-hidden="true" />

        <table className="receipt-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Qty</th>
            </tr>
          </thead>
          <tbody>
            {parcel.items.map((item) => (
              <tr key={`${item.sku}-${item.viaSetTitle ?? ""}`}>
                <td>
                  {item.productTitle}
                  <small>
                    {item.variantTitle && item.variantTitle !== "Default" ? `${item.variantTitle} · ` : ""}
                    {item.sku}
                    {item.viaSetTitle ? ` · part of ${item.viaSetTitle}` : ""}
                  </small>
                </td>
                <td className="num">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-rule" aria-hidden="true" />

        <div className="receipt-grand-total">
          <span>Items</span>
          <span>{totalItems}</span>
        </div>

        {parcel.reshipReason ? (
          <p className="receipt-footer">REPEAT SEND — {parcel.reshipReason}</p>
        ) : null}

        <p className="receipt-footer">Leave this on the parcel.</p>
      </div>
    </main>
  );
}
