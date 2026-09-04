import {
  formatMoney,
  getAdminOperationsData,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreateManualRevenueForm, ManualRevenueRow } from "@/components/admin/manual-revenue-forms";
import type { AdminOrderRow } from "@/lib/admin/operations-data";
import type { Expense, ManualRevenueEntry, PayrollPayment } from "@/lib/commerce/types";
import { createManualRevenueEntryAction, deleteManualRevenueEntryAction } from "./actions";

export const dynamic = "force-dynamic";

type ProductProfitRow = {
  productId: string;
  title: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  costKnown: boolean;
};

type ProductMarginReport = {
  label: string;
  revenue: number;
  cost: number;
  costKnown: boolean;
  orderCount: number;
  rows: ProductProfitRow[];
};

function buildProductMarginReport(label: string, orderRows: AdminOrderRow[], sinceMillis: number): ProductMarginReport {
  const paidInPeriod = orderRows.filter(
    (row) => row.order.paymentStatus === "PAID" && toSortableMillis(row.order.createdAt) >= sinceMillis
  );

  const byProduct = new Map<string, ProductProfitRow>();
  let totalCost = 0;
  let allCostKnown = true;

  for (const row of paidInPeriod) {
    for (const item of row.order.items) {
      const itemCostKnown = item.unitCost !== null && item.unitCost !== undefined;
      const itemCost = itemCostKnown ? (item.unitCost as number) * item.quantity : 0;
      if (!itemCostKnown) {
        allCostKnown = false;
      }
      totalCost += itemCost;

      const existing = byProduct.get(item.productId);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += item.lineTotal;
        existing.cost += itemCost;
        existing.costKnown = existing.costKnown && itemCostKnown;
      } else {
        byProduct.set(item.productId, {
          productId: item.productId,
          title: item.productTitle,
          quantitySold: item.quantity,
          revenue: item.lineTotal,
          cost: itemCost,
          costKnown: itemCostKnown
        });
      }
    }
  }

  return {
    label,
    revenue: paidInPeriod.reduce((total, row) => total + row.order.total, 0),
    cost: totalCost,
    costKnown: allCostKnown,
    orderCount: paidInPeriod.length,
    rows: Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue)
  };
}

type PnlReport = {
  label: string;
  orderCount: number;
  ordersRevenue: number;
  otherRevenue: number;
  revenue: number;
  expenses: number;
  payroll: number;
  netProfit: number;
};

// Cash-basis P&L: revenue is what actually came in (orders + logged other
// income), expenses is everything spent (including raw-material purchases —
// deliberately NOT the recipe-based COGS used in the product margin section
// below, which answers a different question and would double-count against
// this if subtracted here too).
function buildPnlReport(
  label: string,
  data: {
    orderRows: AdminOrderRow[];
    expenses: Expense[];
    payrollPayments: PayrollPayment[];
    manualRevenueEntries: ManualRevenueEntry[];
  },
  sinceMillis: number,
  untilMillis: number
): PnlReport {
  const inRange = (millis: number) => millis >= sinceMillis && millis <= untilMillis;

  const paidInPeriod = data.orderRows.filter(
    (row) => row.order.paymentStatus === "PAID" && inRange(toSortableMillis(row.order.createdAt))
  );
  const ordersRevenue = paidInPeriod.reduce((total, row) => total + row.order.total, 0);
  const otherRevenue = data.manualRevenueEntries
    .filter((entry) => inRange(new Date(entry.date).getTime()))
    .reduce((total, entry) => total + entry.amount, 0);
  const expensesTotal = data.expenses
    .filter((expense) => inRange(new Date(expense.date).getTime()))
    .reduce((total, expense) => total + expense.amount, 0);
  const payrollTotal = data.payrollPayments
    .filter((payment) => inRange(new Date(payment.paidDate).getTime()))
    .reduce((total, payment) => total + payment.grossAmount, 0);
  const revenue = ordersRevenue + otherRevenue;

  return {
    label,
    orderCount: paidInPeriod.length,
    ordersRevenue,
    otherRevenue,
    revenue,
    expenses: expensesTotal,
    payroll: payrollTotal,
    netProfit: revenue - expensesTotal - payrollTotal
  };
}

function getPeriodBoundaries() {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  return {
    now,
    startOfToday: startOfToday.getTime(),
    sevenDaysAgo: now - 7 * 24 * 60 * 60 * 1000,
    thirtyDaysAgo: now - 30 * 24 * 60 * 60 * 1000
  };
}

function parseCustomRange(from: string | undefined, to: string | undefined) {
  if (!from || !to) {
    return null;
  }

  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return null;
  }

  return { from, to, sinceMillis: start.getTime(), untilMillis: end.getTime() };
}

function formatMargin(revenue: number, profit: number) {
  if (revenue <= 0) {
    return "—";
  }
  return `${Math.round((profit / revenue) * 100)}%`;
}

function formatDateLabel(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type AdminFinancialPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function AdminFinancialPage({ searchParams }: AdminFinancialPageProps) {
  await requireAdminPermission("reports.financial");
  const { from, to } = await searchParams;

  const [operations, financial] = await Promise.all([getAdminOperationsData(), getAdminFinancialData()]);
  const disabled = financial.source !== "live";

  const { now, startOfToday, sevenDaysAgo, thirtyDaysAgo } = getPeriodBoundaries();
  const pnlInput = {
    orderRows: operations.orderRows,
    expenses: financial.expenses,
    payrollPayments: financial.payrollPayments,
    manualRevenueEntries: financial.manualRevenueEntries
  };

  const pnlPeriods = [
    buildPnlReport("Today", pnlInput, startOfToday, now),
    buildPnlReport("Last 7 days", pnlInput, sevenDaysAgo, now),
    buildPnlReport("Last 30 days", pnlInput, thirtyDaysAgo, now),
    buildPnlReport("All time", pnlInput, 0, now)
  ];

  const customRange = parseCustomRange(from, to);
  const customPeriod = customRange
    ? buildPnlReport(`${customRange.from} to ${customRange.to}`, pnlInput, customRange.sinceMillis, customRange.untilMillis)
    : null;

  const marginPeriods = [
    buildProductMarginReport("Today", operations.orderRows, startOfToday),
    buildProductMarginReport("Last 7 days", operations.orderRows, sevenDaysAgo),
    buildProductMarginReport("Last 30 days", operations.orderRows, thirtyDaysAgo)
  ];
  const anyCostSet = marginPeriods.some((period) => period.rows.some((row) => row.costKnown));

  const recentRevenueEntries = financial.manualRevenueEntries.slice(0, 50);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Financial</h1>
          <p className="app-subtitle">
            Real cash in vs real cash out — orders, other income, expenses, and payroll — plus a per-product margin
            reference for pricing.
          </p>
        </div>
        <AdminDrawer title="Log other income" triggerLabel="Log income">
          <CreateManualRevenueForm action={createManualRevenueEntryAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {operations.sourceMessage ? (
        <div className="admin-alert" role="status">
          {operations.sourceMessage}
        </div>
      ) : null}
      {financial.sourceMessage ? (
        <div className="admin-alert" role="status">
          {financial.sourceMessage}
        </div>
      ) : null}

      {pnlPeriods.map((period) => (
        <section className="admin-panel" key={period.label}>
          <div className="panel-header">
            <h2>{period.label}</h2>
            <span>{period.orderCount} order{period.orderCount === 1 ? "" : "s"}</span>
          </div>
          <div className="metric-grid">
            <article className="metric">
              <span>Revenue</span>
              <strong>{formatMoney(period.revenue)}</strong>
            </article>
            <article className="metric">
              <span>Expenses</span>
              <strong>{formatMoney(period.expenses)}</strong>
            </article>
            <article className="metric">
              <span>Payroll</span>
              <strong>{formatMoney(period.payroll)}</strong>
            </article>
            <article className="metric">
              <span>Net profit</span>
              <strong>{formatMoney(period.netProfit)}</strong>
            </article>
          </div>
          <p className="admin-help">
            Revenue is {formatMoney(period.ordersRevenue)} from orders
            {period.otherRevenue > 0 ? ` + ${formatMoney(period.otherRevenue)} other income` : ""}.
          </p>
        </section>
      ))}

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Custom range</h2>
        </div>
        <form className="admin-form-grid" method="get">
          <label className="admin-field">
            <span>From</span>
            <input defaultValue={from} name="from" required type="date" />
          </label>
          <label className="admin-field">
            <span>To</span>
            <input defaultValue={to} name="to" required type="date" />
          </label>
          <button className="admin-action" type="submit">
            Show
          </button>
        </form>
        {from && to && !customRange ? <p className="form-error">That date range isn&apos;t valid.</p> : null}
        {customPeriod ? (
          <>
            <div className="metric-grid">
              <article className="metric">
                <span>Revenue</span>
                <strong>{formatMoney(customPeriod.revenue)}</strong>
              </article>
              <article className="metric">
                <span>Expenses</span>
                <strong>{formatMoney(customPeriod.expenses)}</strong>
              </article>
              <article className="metric">
                <span>Payroll</span>
                <strong>{formatMoney(customPeriod.payroll)}</strong>
              </article>
              <article className="metric">
                <span>Net profit</span>
                <strong>{formatMoney(customPeriod.netProfit)}</strong>
              </article>
            </div>
            <p className="admin-help">{customPeriod.orderCount} paid order{customPeriod.orderCount === 1 ? "" : "s"}.</p>
          </>
        ) : null}
      </section>

      <div className="page-heading">
        <div>
          <h2 className="app-title" style={{ fontSize: "1.35rem" }}>
            Product margin reference
          </h2>
          <p className="app-subtitle">
            Revenue against recipe cost per product — for pricing decisions, not part of Net profit above. Set a cost
            per unit on each product (Products &rarr; Edit) to see it here.
          </p>
        </div>
      </div>
      {!anyCostSet ? (
        <div className="admin-alert" role="status">
          No product has a cost per unit set yet, so margin can&apos;t be calculated. Add one from a product&apos;s
          Edit drawer.
        </div>
      ) : null}

      {marginPeriods.map((period) => {
        const profit = period.revenue - period.cost;
        return (
          <section className="admin-panel" key={period.label}>
            <div className="panel-header">
              <h2>{period.label}</h2>
              <span>{period.orderCount} order{period.orderCount === 1 ? "" : "s"}</span>
            </div>
            <div className="metric-grid">
              <article className="metric">
                <span>Revenue</span>
                <strong>{formatMoney(period.revenue)}</strong>
              </article>
              <article className="metric">
                <span>Recipe cost{period.costKnown ? "" : " (partial)"}</span>
                <strong>{formatMoney(period.cost)}</strong>
              </article>
              <article className="metric">
                <span>Gross margin{period.costKnown ? "" : " (partial)"}</span>
                <strong>{formatMoney(profit)}</strong>
              </article>
              <article className="metric">
                <span>Margin</span>
                <strong>{formatMargin(period.revenue, profit)}</strong>
              </article>
            </div>
            <div className="admin-table five">
              <div className="admin-table-row header">
                <span>Product</span>
                <span>Qty sold</span>
                <span>Revenue</span>
                <span>Cost</span>
                <span>Profit</span>
              </div>
              {period.rows.map((row) => (
                <div className="admin-table-row" key={row.productId}>
                  <strong>{row.title}</strong>
                  <span>{row.quantitySold}</span>
                  <span>{formatMoney(row.revenue)}</span>
                  <span>{row.costKnown ? formatMoney(row.cost) : "Not set"}</span>
                  <span>{row.costKnown ? formatMoney(row.revenue - row.cost) : "—"}</span>
                </div>
              ))}
              {period.rows.length === 0 ? <p className="admin-help">No paid orders in this period.</p> : null}
            </div>
          </section>
        );
      })}

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Other income</h2>
          <span>{financial.manualRevenueEntries.length} entries</span>
        </div>
        <div className="stack-list">
          {recentRevenueEntries.map((entry) => (
            <ManualRevenueRow
              amountLabel={formatMoney(entry.amount)}
              dateLabel={formatDateLabel(entry.date)}
              deleteAction={deleteManualRevenueEntryAction}
              disabled={disabled}
              entryId={entry.id}
              key={entry.id}
              label={entry.label}
              note={entry.note}
            />
          ))}
          {recentRevenueEntries.length === 0 ? <p className="admin-help">Nothing logged yet.</p> : null}
        </div>
      </section>
    </>
  );
}
