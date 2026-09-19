import Link from "next/link";
import type { Route } from "next";
import { getAdminOperationsData, toRealDate } from "@/lib/admin/operations-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { getEffectiveRoles } from "@/lib/commerce/operations";
import { hasPermission } from "@/lib/permissions/permissions";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/commerce/format";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminTabs, type AdminTabSpec } from "@/components/admin/admin-tabs";
import {
  DispatchParcelsForm,
  HoldPackingForm,
  MarkDeliveredButton,
  PackOrderForm,
  ReturnParcelForm,
  type PickLine
} from "@/components/admin/dispatch-forms";
import {
  dispatchParcelsAction,
  holdOrderPackingAction,
  markParcelDeliveredAction,
  packOrderAction,
  returnParcelAction
} from "./actions";
import { FULFILMENT_RANK, type Order, type Parcel } from "@/lib/commerce/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function formatWhen(value: Date | undefined | null) {
  const date = toRealDate(value ?? undefined);
  return date ? date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

/**
 * Builds the pick list the same way packOrder does on the server: a set is one
 * order line but several things to physically fetch.
 */
function buildPickLines(order: Order, setComponents: Map<string, PickLine[]>): PickLine[] {
  return order.items.flatMap((item) => {
    const components = setComponents.get(item.variantId);
    if (components) {
      return components.map((component) => ({
        ...component,
        quantity: component.quantity * item.quantity,
        viaSetTitle: item.productTitle
      }));
    }

    return [
      {
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        sku: item.sku,
        quantity: item.quantity
      }
    ];
  });
}

export default async function AdminDispatchPage({ searchParams }: PageProps) {
  const actor = await getRequiredAdminActor();
  const context = getCommerceServerContext();
  const roles = context ? await getEffectiveRoles(context, actor.roleIds) : [];
  if (!hasPermission(roles, actor, "parcels.pack") && !hasPermission(roles, actor, "fulfilment.view")) {
    redirect("/admin");
  }

  const canReturn = hasPermission(roles, actor, "parcels.return");
  const canDispatch = hasPermission(roles, actor, "parcels.dispatch");
  const { tab } = await searchParams;

  const [operations, parcels, allVariants, products] = await Promise.all([
    getAdminOperationsData(),
    context ? context.repo.listParcels().catch((): Parcel[] => []) : Promise.resolve([] as Parcel[]),
    context ? context.repo.listAllVariants().catch(() => []) : Promise.resolve([]),
    context ? context.repo.listProducts().catch(() => []) : Promise.resolve([])
  ]);
  const disabled = operations.source !== "live";

  const productsById = new Map(products.map((product) => [product.id, product]));
  const variantsById = new Map(allVariants.map((variant) => [variant.id, variant]));
  const setComponents = new Map<string, PickLine[]>();
  for (const variant of allVariants) {
    if (!variant.bundleComponents || variant.bundleComponents.length === 0) {
      continue;
    }
    setComponents.set(
      variant.id,
      variant.bundleComponents.flatMap((component) => {
        const componentVariant = variantsById.get(component.variantId);
        if (!componentVariant) {
          return [];
        }
        return [
          {
            productTitle: productsById.get(componentVariant.productId)?.title ?? componentVariant.sku,
            variantTitle: componentVariant.title,
            sku: componentVariant.sku,
            quantity: component.quantity
          }
        ];
      })
    );
  }

  const parcelsByOrderId = new Map<string, Parcel[]>();
  for (const parcel of parcels) {
    parcelsByOrderId.set(parcel.orderId, [...(parcelsByOrderId.get(parcel.orderId) ?? []), parcel]);
  }

  // Paid, not cancelled, and without a parcel that's still live.
  const toPack = operations.orders.filter((order) => {
    if (order.paymentStatus !== "PAID" || order.fulfilmentStatus === "CANCELLED") {
      return false;
    }
    if (order.channel === "POS") {
      return false;
    }
    // Orders from before parcels existed have no parcel but are already gone;
    // only those not yet past packing (or returned, awaiting a reship) queue up.
    if (
      order.fulfilmentStatus !== "RETURNED" &&
      FULFILMENT_RANK[order.fulfilmentStatus] >= FULFILMENT_RANK.PACKED
    ) {
      return false;
    }
    return !(parcelsByOrderId.get(order.id) ?? []).some((parcel) => parcel.status !== "RETURNED");
  });

  const packed = parcels.filter((parcel) => parcel.status === "PACKED");
  const packedForDelivery = packed.filter((parcel) => !parcel.isPickup);
  const packedForPickup = packed.filter((parcel) => parcel.isPickup);
  const inTransit = parcels.filter((parcel) => parcel.status === "DISPATCHED");
  const returned = parcels.filter((parcel) => parcel.status === "RETURNED");
  const delivered = parcels.filter((parcel) => parcel.status === "DELIVERED");
  const reships = parcels.filter((parcel) => parcel.reshipOfParcelId);

  const rtoRate =
    delivered.length + returned.length > 0
      ? Math.round((returned.length / (delivered.length + returned.length)) * 100)
      : null;

  const toPackTab = (
    <>
      <div className="admin-alert" role="status">
        Tap <strong>Pack</strong> <em>before</em> you go to the shelf — the slip that prints is your pick list,
        and it&apos;s what stops someone else packing the same order behind you.
      </div>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>To pack</h2>
          <span>{toPack.length} waiting</span>
        </div>
        <div className="stack-list">
          {toPack.map((order) => {
            const history = parcelsByOrderId.get(order.id) ?? [];
            const lines = buildPickLines(order, setComponents);
            return (
              <div className="stack-row" key={order.id}>
                <strong>
                  {order.orderNumber}
                  {history.length > 0 ? ` · reship` : ""}
                </strong>
                <span>
                  {order.customerSnapshot?.name ?? "Customer"}
                  {order.deliveryMethod?.name ? ` · ${order.deliveryMethod.name}` : ""}
                  {order.customerSnapshot?.address ? ` · ${order.customerSnapshot.address}` : ""}
                  {order.packHold ? ` · on hold: ${order.packHold.reason}` : ""}
                </span>
                <div className="stack-row-actions">
                  <strong>{formatMoney(order.total)}</strong>
                  <AdminDrawer title={`Pack ${order.orderNumber}`} triggerClassName="admin-action small" triggerLabel="Pack">
                    <PackOrderForm
                      action={packOrderAction}
                      disabled={disabled}
                      lines={lines}
                      needsReshipReason={history.length > 0}
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                    />
                  </AdminDrawer>
                  <AdminDrawer
                    title={`Hold ${order.orderNumber}`}
                    triggerClassName="admin-action ghost small"
                    triggerLabel="Can't pack"
                  >
                    <HoldPackingForm action={holdOrderPackingAction} disabled={disabled} orderId={order.id} />
                  </AdminDrawer>
                </div>
              </div>
            );
          })}
          {toPack.length === 0 ? <p className="admin-help">Nothing waiting to be packed.</p> : null}
        </div>
      </section>
    </>
  );

  const packedTab = (
    <>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Ready to go out</h2>
          <span>{packedForDelivery.length} packed</span>
        </div>
        {canDispatch && packedForDelivery.length > 0 ? (
          <div className="admin-panel-section">
            <DispatchParcelsForm
              action={dispatchParcelsAction}
              disabled={disabled}
              parcels={packedForDelivery.map((parcel) => ({
                id: parcel.id,
                parcelNumber: parcel.parcelNumber,
                orderNumber: parcel.orderNumber,
                customerName: parcel.customerName,
                destination: parcel.customerAddress,
                slipHref: `/packing-slip/${parcel.id}`
              }))}
            />
          </div>
        ) : (
          <p className="admin-help">Nothing on the bench waiting for a rider.</p>
        )}
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Waiting for collection</h2>
          <span>{packedForPickup.length} packed</span>
        </div>
        <p className="admin-help">
          Pickup orders sit here until the customer comes in — they&apos;re kept apart so they don&apos;t clutter
          the rider queue.
        </p>
        <div className="stack-list">
          {packedForPickup.map((parcel) => (
            <div className="stack-row" key={parcel.id}>
              <strong>{parcel.parcelNumber}</strong>
              <span>
                {parcel.customerName ?? "Customer"} · packed {formatWhen(parcel.packedAt)} by{" "}
                {parcel.packedByName ?? "staff"}
              </span>
              <div className="stack-row-actions">
                <Link
                  className="admin-action ghost small"
                  href={`/packing-slip/${parcel.id}` as Route}
                  target="_blank"
                >
                  Slip
                </Link>
                {canDispatch ? (
                  <MarkDeliveredButton action={markParcelDeliveredAction} disabled={disabled} parcelId={parcel.id} />
                ) : null}
              </div>
            </div>
          ))}
          {packedForPickup.length === 0 ? <p className="admin-help">Nothing waiting for collection.</p> : null}
        </div>
      </section>
    </>
  );

  const outTab = (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>Out with a rider</h2>
        <span>{inTransit.length} parcels</span>
      </div>
      <p className="admin-help">
        Assumed delivered unless one comes back. Mark returns as they arrive so the count stays honest.
      </p>
      <div className="stack-list">
        {inTransit.map((parcel) => (
          <div className="stack-row" key={parcel.id}>
            <strong>{parcel.parcelNumber}</strong>
            <span>
              {parcel.customerName ?? "Customer"}
              {parcel.customerAddress ? ` · ${parcel.customerAddress}` : ""} · out {formatWhen(parcel.dispatchedAt)}
              {parcel.courier ? ` with ${parcel.courier}` : ""}
            </span>
            <div className="stack-row-actions">
              <Link className="admin-action ghost small" href={`/packing-slip/${parcel.id}` as Route} target="_blank">
                Slip
              </Link>
              {canDispatch ? (
                <MarkDeliveredButton action={markParcelDeliveredAction} disabled={disabled} parcelId={parcel.id} />
              ) : null}
              {canReturn ? (
                <AdminDrawer
                  title={`Return ${parcel.parcelNumber}`}
                  triggerClassName="admin-action ghost small"
                  triggerLabel="Came back"
                >
                  <ReturnParcelForm
                    action={returnParcelAction}
                    disabled={disabled}
                    parcelId={parcel.id}
                    parcelNumber={parcel.parcelNumber}
                  />
                </AdminDrawer>
              ) : null}
            </div>
          </div>
        ))}
        {inTransit.length === 0 ? <p className="admin-help">Nothing out for delivery.</p> : null}
      </div>
    </section>
  );

  const returnsTab = (
    <>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Returns</h2>
          <span>
            {returned.length} back{rtoRate !== null ? ` · ${rtoRate}% of everything dispatched` : ""}
          </span>
        </div>
        <div className="stack-list">
          {returned.map((parcel) => (
            <div className="stack-row" key={parcel.id}>
              <strong>{parcel.parcelNumber}</strong>
              <span>
                {parcel.customerName ?? "Customer"} · {formatWhen(parcel.returnedAt)} · {parcel.returnReason}
              </span>
            </div>
          ))}
          {returned.length === 0 ? <p className="admin-help">Nothing has come back.</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Sent a second time</h2>
          <span>{reships.length}</span>
        </div>
        <p className="admin-help">
          Every parcel here is a repeat send. A short list is normal; a growing one is worth looking into.
        </p>
        <div className="stack-list">
          {reships.map((parcel) => (
            <div className="stack-row" key={parcel.id}>
              <strong>{parcel.parcelNumber}</strong>
              <span>
                packed {formatWhen(parcel.packedAt)} by {parcel.packedByName ?? "staff"} ·{" "}
                {parcel.reshipReason ?? "no reason given"}
              </span>
            </div>
          ))}
          {reships.length === 0 ? <p className="admin-help">No order has been sent twice.</p> : null}
        </div>
      </section>
    </>
  );

  const tabs: AdminTabSpec[] = [
    { id: "to-pack", label: `To pack${toPack.length > 0 ? ` (${toPack.length})` : ""}`, content: toPackTab },
    { id: "packed", label: `Packed${packed.length > 0 ? ` (${packed.length})` : ""}`, content: packedTab },
    { id: "out", label: `Out${inTransit.length > 0 ? ` (${inTransit.length})` : ""}`, content: outTab },
    { id: "returns", label: "Returns", content: returnsTab }
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Dispatch</h1>
          <p className="app-subtitle">
            Pack, hand over, and track what comes back. One order can only have one parcel out at a time.
          </p>
        </div>
      </div>
      {operations.sourceMessage ? (
        <div className="admin-alert" role="status">
          {operations.sourceMessage}
        </div>
      ) : null}
      <AdminTabs initialTabId={tab} tabs={tabs} />
    </>
  );
}
