import Link from "next/link";
import type { Route } from "next";
import { Fragment, type ReactNode } from "react";
import {
  formatMoney,
  getAdminOperationsData,
  toRealDate,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import {
  buildChannelTotals,
  buildExpensesByCategory,
  buildMonthOptions,
  buildPayrollAccrual,
  buildPnlReport,
  getPeriodBoundaries,
  parseCustomRange,
  type PnlInput
} from "@/lib/admin/financial-reports";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getEffectiveRoles } from "@/lib/commerce/operations";
import { hasPermission } from "@/lib/permissions/permissions";
import { redirect } from "next/navigation";
import { computeAssetBookValue } from "@/lib/commerce/depreciation";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminTabs, type AdminTabSpec } from "@/components/admin/admin-tabs";
import { TaxonomyRow } from "@/components/admin/taxonomy-row";
import { CreateManualRevenueForm, ManualRevenueRow } from "@/components/admin/manual-revenue-forms";
import {
  CreateExpenseCategoryForm,
  CreateExpenseForm,
  CreateRecurringExpenseForm,
  ExpenseLog,
  RecurringExpenseRow
} from "@/components/admin/expense-forms";
import { AssetRow, CreateAssetForm } from "@/components/admin/asset-forms";
import { CreateWorkerForm, PayWorkerForm, PayrollHistoryRow, WorkerRow } from "@/components/admin/worker-forms";
import type { AdminOrderRow } from "@/lib/admin/operations-data";
import { createManualRevenueEntryAction, deleteManualRevenueEntryAction } from "./actions";
import {
  attachExpenseReceiptAction,
  createExpenseAction,
  createExpenseCategoryAction,
  createRecurringExpenseTemplateAction,
  deleteExpenseAction,
  deleteRecurringExpenseTemplateAction,
  logRecurringExpenseAction,
  quickEditExpenseCategoryAction,
  removeExpenseReceiptAction,
  updateExpenseAction
} from "../expenses/actions";
import { createCapitalAssetAction, deleteCapitalAssetAction, updateCapitalAssetAction } from "../assets/actions";
import {
  createWorkerAction,
  deletePayrollPaymentAction,
  deleteWorkerAction,
  payWorkerAction,
  updateWorkerAction
} from "../payroll/actions";

export const dynamic = "force-dynamic";

const ASSET_CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: "Equipment",
  FURNITURE: "Furniture",
  MACHINE: "Machine",
  PROPERTY: "Property",
  OTHER: "Other"
};

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

function formatMargin(revenue: number, profit: number) {
  if (revenue <= 0) {
    return "—";
  }
  return `${Math.round((profit / revenue) * 100)}%`;
}

function formatDateLabel(value: Date) {
  const date = toRealDate(value);
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not set";
}

// toISOString() throws RangeError on an Invalid Date, which a raw Firestore
// Timestamp always produces — that crashed the whole page render.
function toDateInputValue(value: Date) {
  return (toRealDate(value) ?? new Date()).toISOString().slice(0, 10);
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

type CashTrendPoint = {
  label: string;
  value: number;
};

function buildCashTrend(data: PnlInput, days = 14): CashTrendPoint[] {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const startMillis = end.getTime() - (days - 1) * DAY_MS;
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(startMillis + index * DAY_MS);
    return {
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value: 0
    };
  });

  const addToBucket = (millis: number, amount: number) => {
    const index = Math.floor((millis - startMillis) / DAY_MS);
    if (index >= 0 && index < buckets.length) {
      buckets[index].value += amount;
    }
  };

  for (const row of data.orderRows) {
    if (row.order.paymentStatus === "PAID") {
      addToBucket(toSortableMillis(row.order.createdAt), row.order.total);
    }
  }
  for (const entry of data.manualRevenueEntries) {
    addToBucket(toRealDate(entry.date)?.getTime() ?? NaN, entry.amount);
  }
  for (const expense of data.expenses) {
    addToBucket(toRealDate(expense.date)?.getTime() ?? NaN, -expense.amount);
  }
  for (const payment of data.payrollPayments) {
    addToBucket(toRealDate(payment.paidDate)?.getTime() ?? NaN, -payment.grossAmount);
  }

  return buckets;
}

function formatDeltaLabel(current: number, previous: number, label = "previous period") {
  if (previous <= 0) {
    return current > 0 ? "New activity" : "No activity yet";
  }

  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs ${label}`;
}

function percentWidth(value: number, max: number) {
  if (max <= 0 || value <= 0) {
    return "4%";
  }

  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function formatChannelName(channel: string) {
  return channel
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MoneyTrend({ points, id }: { points: CashTrendPoint[]; id: string }) {
  const values = points.map((point) => point.value);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const spread = max - min || 1;
  const linePoints = points
    .map((point, index) => {
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 42 - ((point.value - min) / spread) * 34;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPoints = `0,44 ${linePoints} 100,44`;

  return (
    <svg aria-hidden="true" className="money-trend" preserveAspectRatio="none" viewBox="0 0 100 44">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#cf3e6e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#cf3e6e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} />
      <polyline points={linePoints} />
    </svg>
  );
}

function MoneyStat({
  label,
  value,
  note,
  tone = "accent"
}: {
  label: string;
  value: string;
  note: string;
  tone?: "accent" | "green" | "warn" | "dark";
}) {
  return (
    <article className={`money-stat ${tone}`}>
      <div className="money-stat-top">
        <span>{label}</span>
        <i aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

type AdminFinancialPageProps = {
  searchParams: Promise<{ from?: string; to?: string; tab?: string; month?: string }>;
};

export default async function AdminFinancialPage({ searchParams }: AdminFinancialPageProps) {
  const actor = await getRequiredAdminActor();
  const context = getCommerceServerContext();
  const roles = context ? await getEffectiveRoles(context, actor.roleIds) : [];
  if (!hasPermission(roles, actor, "reports.financial")) {
    redirect("/admin");
  }

  const canSeeExpenses = hasPermission(roles, actor, "expenses.view");
  const canSeeAssets = hasPermission(roles, actor, "assets.view");
  const canSeePayroll = hasPermission(roles, actor, "payroll.view");

  const { from, to, tab, month } = await searchParams;
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
    { key: "today", ...buildPnlReport("Today", pnlInput, startOfToday, now) },
    { key: "7d", ...buildPnlReport("Last 7 days", pnlInput, sevenDaysAgo, now) },
    { key: "30d", ...buildPnlReport("Last 30 days", pnlInput, thirtyDaysAgo, now) },
    { key: "all", ...buildPnlReport("All time", pnlInput, 0, now) }
  ];
  // One month selector drives every panel below, so the headline number, the
  // channel bars, and the category breakdown always describe the same span.
  // They previously each picked their own window, and the channel bars had no
  // date bound at all.
  const monthOptions = buildMonthOptions(new Date(now), 12);
  const selectedMonth = monthOptions.find((option) => option.key === month) ?? monthOptions[0];
  const isCurrentMonth = selectedMonth.key === monthOptions[0].key;
  // The live month has no future to report on, so stop it at "now".
  const monthUntil = isCurrentMonth ? now : selectedMonth.untilMillis;
  const previousMonthOption = buildMonthOptions(new Date(selectedMonth.sinceMillis), 2)[1];

  const monthPeriod = {
    key: "month",
    ...buildPnlReport(selectedMonth.label, pnlInput, selectedMonth.sinceMillis, monthUntil)
  };
  const previousMonthPeriod = buildPnlReport(
    previousMonthOption.label,
    pnlInput,
    previousMonthOption.sinceMillis,
    previousMonthOption.untilMillis
  );
  const cashTrend = buildCashTrend(pnlInput);
  const currentMonthExpenseBreakdown = buildExpensesByCategory(
    financial.expenses,
    financial.expenseCategories,
    selectedMonth.sinceMillis,
    monthUntil
  );
  const paidChannelTotals = buildChannelTotals(
    operations.orderRows,
    ["ONLINE", "POS", "ADMIN_CREATED"],
    selectedMonth.sinceMillis,
    monthUntil
  );
  const maxChannelRevenue = Math.max(1, ...paidChannelTotals.map((row) => row.revenue));
  const maxExpenseCategoryTotal = Math.max(1, ...currentMonthExpenseBreakdown.rows.map((row) => row.total));
  const totalBookValue = financial.capitalAssets.reduce((total, asset) => total + computeAssetBookValue(asset), 0);
  const currentPayrollTotal = financial.workers
    .filter((worker) => worker.status === "ACTIVE")
    .reduce((total, worker) => total + worker.monthlySalary, 0);
  const activeShiftCount = operations.posShifts.filter((shift) => shift.status === "OPEN").length;
  const openShiftExpectedCash = operations.posShifts
    .filter((shift) => shift.status === "OPEN")
    .reduce((total, shift) => total + (shift.expectedCash ?? 0), 0);
  const dueRecurringExpenses = financial.recurringExpenseTemplates.filter(
    (template) => template.active && template.lastLoggedPeriod !== currentPeriod()
  );
  const missingCostCount = operations.variants.filter((variant) => variant.active && variant.cost == null).length;
  const payrollAccrual = buildPayrollAccrual(financial.workers, financial.payrollPayments, currentPeriod());
  // Hoisted above the tabs so the Overview action dock can open the same
  // payroll run in a dialog without duplicating the lookups.
  const payrollPeriod = currentPeriod();
  const activeWorkers = financial.workers.filter((worker) => worker.status === "ACTIVE");
  const paymentsThisPeriod = new Map(
    financial.payrollPayments
      .filter((payment) => payment.period === payrollPeriod)
      .map((payment) => [payment.workerId, payment])
  );
  const expenseCategoriesById = new Map(financial.expenseCategories.map((category) => [category.id, category]));
  const recentExpenses = financial.expenses.slice(0, 8);
  // Targeted fetch by id rather than listing every media asset — most
  // expenses have no receipt, and the media collection is the product
  // catalogue's, which is far larger than this page needs.
  const receiptMediaIds = Array.from(
    new Set(financial.expenses.map((expense) => expense.receiptMediaId).filter((id): id is string => Boolean(id)))
  );
  const receiptUrlById = new Map(
    context && receiptMediaIds.length > 0
      ? (await context.repo.findMediaByIds(receiptMediaIds)).map((asset) => [asset.id, asset.url])
      : []
  );

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
  const reviewItems = [
    {
      title: activeShiftCount > 0 ? "Close POS shift" : "POS shifts settled",
      detail:
        activeShiftCount > 0
          ? "Open shifts should be counted before the day is closed."
          : "No open shift needs cash review right now.",
      value: activeShiftCount > 0 ? formatMoney(openShiftExpectedCash) : "Clear",
      href: "/pos",
      actionLabel: activeShiftCount > 0 ? "Open POS" : "View POS"
    },
    {
      title: payrollAccrual.outstanding > 0 ? "Payroll not yet recorded" : "Payroll recorded",
      detail:
        payrollAccrual.outstanding > 0
          ? `${payrollAccrual.unpaidWorkerCount} worker${payrollAccrual.unpaidWorkerCount === 1 ? "" : "s"} unpaid this month — net profit above does not include this yet.`
          : "Every active worker has a payment recorded for this month.",
      value: payrollAccrual.outstanding > 0 ? formatMoney(payrollAccrual.outstanding) : "Clear",
      href: "/admin/financial?tab=payroll",
      actionLabel: "Payroll"
    },
    {
      title: dueRecurringExpenses.length > 0 ? "Recurring expenses due" : "Recurring expenses current",
      detail:
        dueRecurringExpenses.length > 0
          ? "Log the due items so this month stays accurate."
          : "Every recurring expense has been handled for this period.",
      value: dueRecurringExpenses.length > 0 ? `${dueRecurringExpenses.length} due` : "Clear",
      href: "/admin/financial?tab=expenses",
      actionLabel: "Expenses"
    },
    {
      title: missingCostCount > 0 ? "Missing product costs" : "Product costs ready",
      detail:
        missingCostCount > 0
          ? "Set unit costs to make product margin reports reliable."
          : "Active variants have cost data for margin reporting.",
      value: missingCostCount > 0 ? `${missingCostCount} SKU${missingCostCount === 1 ? "" : "s"}` : "Clear",
      href: "/admin/products",
      actionLabel: "Products"
    }
  ];

  const overviewTab = (
    <div className="money-workspace">
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

      <form action="/admin/financial" className="money-period-form" method="get">
        <label className="admin-field">
          <span>Period</span>
          <select defaultValue={selectedMonth.key} name="month">
            {monthOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="admin-action ghost" type="submit">
          Show
        </button>
      </form>

      <section className="money-hero-panel">
        <div className="money-hero-copy">
          <div className="money-kicker">Cash-basis profit and loss · {selectedMonth.label}</div>
          <h2>{formatMoney(monthPeriod.netProfit)}</h2>
          <p>
            What the business kept after payment fees, expenses, and payroll. Sales tax and Paystack&apos;s cut
            are excluded — that money is never yours to keep.
          </p>
          <div className="money-hero-meta">
            <span>{monthPeriod.orderCount} paid order{monthPeriod.orderCount === 1 ? "" : "s"}</span>
            <span>{formatDeltaLabel(monthPeriod.netProfit, previousMonthPeriod.netProfit, previousMonthOption.label)}</span>
            {payrollAccrual.outstanding > 0 && isCurrentMonth ? (
              <span className="money-hero-warning">
                Excludes {formatMoney(payrollAccrual.outstanding)} unrecorded payroll
              </span>
            ) : null}
          </div>
        </div>
        <div className="money-hero-visual">
          <MoneyTrend id="financial-month-trend" points={cashTrend} />
        </div>
      </section>

      <section aria-label="Financial metrics" className="money-stat-grid">
        <MoneyStat
          label="Income"
          note={`${formatMoney(monthPeriod.productRevenue)} product · ${formatMoney(monthPeriod.deliveryRevenue)} delivery`}
          value={formatMoney(monthPeriod.revenue)}
        />
        <MoneyStat
          label="Expenses"
          note={`${currentMonthExpenseBreakdown.count} item${currentMonthExpenseBreakdown.count === 1 ? "" : "s"} logged`}
          tone="warn"
          value={formatMoney(monthPeriod.expenses)}
        />
        <MoneyStat
          label="Payment fees"
          note={
            monthPeriod.paymentFees > 0
              ? "Charged to customers, paid to Paystack — not profit"
              : "No card or mobile money fees this period"
          }
          tone="warn"
          value={formatMoney(monthPeriod.paymentFees)}
        />
        <MoneyStat
          label="Payroll recorded"
          note={
            payrollAccrual.outstanding > 0
              ? `${formatMoney(payrollAccrual.outstanding)} still to record of ${formatMoney(currentPayrollTotal)}`
              : `${formatMoney(currentPayrollTotal)} monthly payroll, fully recorded`
          }
          tone="green"
          value={formatMoney(monthPeriod.payroll)}
        />
        <MoneyStat
          label="Assets"
          note={`${financial.capitalAssets.length} asset${financial.capitalAssets.length === 1 ? "" : "s"} registered`}
          tone="dark"
          value={formatMoney(totalBookValue)}
        />
      </section>

      <section className="money-action-dock" aria-label="Financial actions">
        <div>
          <strong>Record something</strong>
          <span>Log an expense or income, run payroll, register an asset, or print a statement — without leaving this page.</span>
        </div>
        <div className="money-action-dock-actions">
          {canSeeExpenses && financial.expenseCategories.length > 0 ? (
            <AdminDrawer title="Log an expense" triggerClassName="money-primary-action" triggerLabel="Log expense">
              <CreateExpenseForm action={createExpenseAction} categories={financial.expenseCategories} disabled={disabled} />
            </AdminDrawer>
          ) : null}
          <AdminDrawer
            title="Log other income"
            triggerClassName={
              canSeeExpenses && financial.expenseCategories.length > 0 ? "money-secondary-action" : "money-primary-action"
            }
            triggerLabel="Log income"
          >
            <CreateManualRevenueForm action={createManualRevenueEntryAction} disabled={disabled} />
          </AdminDrawer>
          {canSeePayroll ? (
            <AdminDrawer title={`Run payroll — ${payrollPeriod}`} triggerClassName="money-secondary-action" triggerLabel="Run payroll">
              <div className="stack-list">
                {activeWorkers.map((worker) => {
                  const existing = paymentsThisPeriod.get(worker.id);
                  return (
                    <PayWorkerForm
                      action={payWorkerAction}
                      alreadyPaid={Boolean(existing)}
                      defaultGrossValue={((existing?.grossAmount ?? worker.monthlySalary) / 100).toFixed(2)}
                      disabled={disabled}
                      key={worker.id}
                      period={payrollPeriod}
                      workerId={worker.id}
                      workerName={worker.name}
                    />
                  );
                })}
                {activeWorkers.length === 0 ? (
                  <p className="admin-help">Add a worker under the Setup tab first.</p>
                ) : null}
              </div>
            </AdminDrawer>
          ) : null}
          {canSeeAssets ? (
            <AdminDrawer title="Register an asset" triggerClassName="money-secondary-action" triggerLabel="Add asset">
              <CreateAssetForm action={createCapitalAssetAction} disabled={disabled} />
            </AdminDrawer>
          ) : null}
          <Link
            className="money-secondary-action"
            href={`/admin/financial/print/pnl?month=${selectedMonth.key}` as Route}
            target="_blank"
          >
            Print P&amp;L
          </Link>
        </div>
      </section>

      <div className="money-dashboard-grid">
        <section className="money-panel">
          <div className="money-panel-header">
            <div>
              <h3>Money in by channel</h3>
              <p>Paid revenue across online, POS, and admin-created sales.</p>
            </div>
            <span>{formatMoney(monthPeriod.ordersRevenue)}</span>
          </div>
          <div className="money-bars">
            {paidChannelTotals.map((row) => (
              <div className="money-bar-row" key={row.channel}>
                <div className="money-bar-label">
                  <strong>{formatChannelName(row.channel)}</strong>
                  <span>
                    {row.orders} order{row.orders === 1 ? "" : "s"} · {formatMoney(row.revenue)}
                  </span>
                </div>
                <div className="money-bar-track">
                  <span className={`money-bar-fill ${row.channel.toLowerCase()}`} style={{ width: percentWidth(row.revenue, maxChannelRevenue) }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="money-panel">
          <div className="money-panel-header">
            <div>
              <h3>Needs review</h3>
              <p>The money checks that need an owner or manager decision.</p>
            </div>
            <span>{reviewItems.filter((item) => item.value !== "Clear").length} item{reviewItems.filter((item) => item.value !== "Clear").length === 1 ? "" : "s"}</span>
          </div>
          <div className="money-review-list">
            {reviewItems.map((item) => (
              <div className="money-review-row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <em>{item.value}</em>
                <Link className="money-row-action" href={item.href as Route}>
                  {item.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="money-dashboard-grid">
        <section className="money-panel">
          <div className="money-panel-header">
            <div>
              <h3>Expenses by category</h3>
              <p>QuickBooks-style operating cost view for the current month.</p>
            </div>
            <span>{formatMoney(currentMonthExpenseBreakdown.total)}</span>
          </div>
          <div className="money-bars">
            {currentMonthExpenseBreakdown.rows.slice(0, 5).map((row) => (
              <div className="money-bar-row" key={row.categoryId}>
                <div className="money-bar-label">
                  <strong>{row.categoryTitle}</strong>
                  <span>
                    {row.count} item{row.count === 1 ? "" : "s"} · {formatMoney(row.total)}
                  </span>
                </div>
                <div className="money-bar-track">
                  <span className="money-bar-fill expenses" style={{ width: percentWidth(row.total, maxExpenseCategoryTotal) }} />
                </div>
              </div>
            ))}
            {currentMonthExpenseBreakdown.rows.length === 0 ? (
              <p className="admin-help">No expenses logged for this month yet.</p>
            ) : null}
          </div>
        </section>

        {canSeeExpenses ? (
          <section className="money-panel">
            <div className="money-panel-header">
              <div>
                <h3>Latest expenses</h3>
                <p>The most recent entries, newest first.</p>
              </div>
              <span>{financial.expenses.length} logged</span>
            </div>
            <div className="money-income-list">
              {recentExpenses.map((expense) => (
                <div className="stack-row" key={expense.id}>
                  <strong>{expense.name || expenseCategoriesById.get(expense.categoryId)?.title || "Expense"}</strong>
                  <span>
                    {formatDateLabel(expense.date)} ·{" "}
                    {expenseCategoriesById.get(expense.categoryId)?.title ?? "Uncategorized"}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </span>
                  <div className="stack-row-actions">
                    <strong>{formatMoney(expense.amount)}</strong>
                  </div>
                </div>
              ))}
              {financial.expenses.length === 0 ? (
                <p className="admin-help">Nothing logged yet — use &quot;Log expense&quot; above.</p>
              ) : null}
            </div>
            {financial.expenses.length > recentExpenses.length ? (
              <div className="admin-panel-footer-row">
                <span />
                <Link className="text-button" href={"/admin/financial?tab=expenses" as Route}>
                  See all {financial.expenses.length} expenses
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="money-panel">
          <div className="money-panel-header">
            <div>
              <h3>Statements &amp; other income</h3>
              <p>Run custom ranges and keep non-order income visible.</p>
            </div>
            <Link className="money-row-action" href={"/admin/financial/print/pnl?period=30d" as Route} target="_blank">
              Print 30 days
            </Link>
          </div>
          <form className="money-range-form" method="get">
            <label className="admin-field">
              <span>From</span>
              <input defaultValue={from} name="from" required type="date" />
            </label>
            <label className="admin-field">
              <span>To</span>
              <input defaultValue={to} name="to" required type="date" />
            </label>
            <button className="admin-action" type="submit">
              Show range
            </button>
          </form>
          {from && to && !customRange ? <p className="form-error">That date range isn&apos;t valid.</p> : null}
          {customPeriod ? (
            <div className="money-range-result">
              <strong>{formatMoney(customPeriod.netProfit)} net profit</strong>
              <span>
                {customPeriod.orderCount} paid order{customPeriod.orderCount === 1 ? "" : "s"} ·{" "}
                {formatMoney(customPeriod.revenue)} revenue
              </span>
              <Link className="text-button" href={`/admin/financial/print/pnl?from=${from}&to=${to}` as Route} target="_blank">
                Print custom statement
              </Link>
            </div>
          ) : null}
          <div className="money-income-list">
            {recentRevenueEntries.slice(0, 3).map((entry) => (
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
            {recentRevenueEntries.length === 0 ? <p className="admin-help">No other income has been logged yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );

  const marginReferenceContent = (
    <>
      <div className="page-heading">
        <div>
          <h2 className="app-title" style={{ fontSize: "1.35rem" }}>
            Product margin reference
          </h2>
          <p className="app-subtitle">
            Revenue against recipe cost per product — for pricing decisions, not part of Net profit. Set a cost per
            unit on each product (Products &rarr; Edit) to see it here.
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
    </>
  );

  const reportsTab = (
    <>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Profit &amp; Loss statement</h2>
        </div>
        <div className="stack-list">
          {pnlPeriods.map((period) => (
            <div className="stack-row" key={period.key}>
              <strong>{period.label}</strong>
              <span>Net profit {formatMoney(period.netProfit)}</span>
              <div className="stack-row-actions">
                <Link className="admin-action ghost small" href={`/admin/financial/print/pnl?period=${period.key}` as Route} target="_blank">
                  Print
                </Link>
              </div>
            </div>
          ))}
        </div>
        <form className="admin-form-grid admin-panel-section" action="/admin/financial/print/pnl" method="get" target="_blank">
          <label className="admin-field">
            <span>From</span>
            <input name="from" required type="date" />
          </label>
          <label className="admin-field">
            <span>To</span>
            <input name="to" required type="date" />
          </label>
          <button className="admin-action" type="submit">
            Print custom range
          </button>
        </form>
      </section>

      {canSeeExpenses ? (
        <section className="admin-panel">
          <div className="panel-header">
            <h2>Expense report</h2>
          </div>
          <div className="stack-list">
            {pnlPeriods.map((period) => (
              <div className="stack-row" key={period.key}>
                <strong>{period.label}</strong>
                <span>Total {formatMoney(period.expenses)}</span>
                <div className="stack-row-actions">
                  <Link
                    className="admin-action ghost small"
                    href={`/admin/financial/print/expenses?period=${period.key}` as Route}
                    target="_blank"
                  >
                    Print
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <form
            className="admin-form-grid admin-panel-section"
            action="/admin/financial/print/expenses"
            method="get"
            target="_blank"
          >
            <label className="admin-field">
              <span>From</span>
              <input name="from" required type="date" />
            </label>
            <label className="admin-field">
              <span>To</span>
              <input name="to" required type="date" />
            </label>
            <button className="admin-action" type="submit">
              Print custom range
            </button>
          </form>
        </section>
      ) : null}

      {marginReferenceContent}
    </>
  );

  // Tab order is deliberate: the day-to-day work (Overview, Expenses,
  // Payroll) comes first, statements next, and one-time configuration last
  // in a Setup tab — categories, recurring templates, worker profiles, and
  // the asset register are all set up once and then rarely touched, so they
  // shouldn't compete for attention with the expense log.
  const tabs: AdminTabSpec[] = [{ id: "overview", label: "Overview", content: overviewTab }];
  const setupSections: ReactNode[] = [];

  if (canSeeExpenses) {
    const categoriesById = new Map(financial.expenseCategories.map((category) => [category.id, category]));
    const period = currentPeriod();
    const allExpensesTotal = financial.expenses.reduce((total, expense) => total + expense.amount, 0);

    tabs.push({
      id: "expenses",
      label: "Expenses",
      content: (
        <>
          {financial.expenseCategories.length === 0 ? (
            <div className="admin-alert" role="status">
              Add a category first — categories live under the Setup tab.
            </div>
          ) : null}

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Expense log</h2>
              <span>{financial.expenses.length} logged &middot; {formatMoney(allExpensesTotal)} total</span>
            </div>
            <div className="admin-panel-footer-row">
              <span className="admin-help">
                {formatMoney(currentMonthExpenseBreakdown.total)} this month across{" "}
                {currentMonthExpenseBreakdown.count} entr
                {currentMonthExpenseBreakdown.count === 1 ? "y" : "ies"}.
              </span>
              {financial.expenseCategories.length > 0 ? (
                <AdminDrawer title="Log an expense" triggerLabel="Log expense">
                  <CreateExpenseForm
                    action={createExpenseAction}
                    categories={financial.expenseCategories}
                    disabled={disabled}
                  />
                </AdminDrawer>
              ) : null}
            </div>
            <ExpenseLog
              attachReceiptAction={attachExpenseReceiptAction}
              categories={financial.expenseCategories}
              deleteAction={deleteExpenseAction}
              disabled={disabled}
              entries={financial.expenses.map((expense) => ({
                id: expense.id,
                name: expense.name,
                categoryId: expense.categoryId,
                categoryTitle: categoriesById.get(expense.categoryId)?.title ?? "Uncategorized",
                dateLabel: formatDateLabel(expense.date),
                dateValue: toDateInputValue(expense.date),
                amountLabel: formatMoney(expense.amount),
                amountValue: (expense.amount / 100).toFixed(2),
                amountMinor: expense.amount,
                note: expense.note,
                isRecurring: Boolean(expense.recurringTemplateId),
                receiptUrl: expense.receiptMediaId ? receiptUrlById.get(expense.receiptMediaId) : undefined
              }))}
              removeReceiptAction={removeExpenseReceiptAction}
              updateAction={updateExpenseAction}
            />
            <div className="admin-panel-footer-row">
              <span />
              <Link className="text-button" href={"/admin/financial/print/expenses?period=all" as Route} target="_blank">
                Print all-time expense report
              </Link>
            </div>
          </section>
        </>
      )
    });

    setupSections.push(
      <Fragment key="expense-setup">
        <section className="admin-panel">
          <div className="panel-header">
            <h2>Expense categories</h2>
            <span>
              {financial.expenseCategories.length} categories &middot; {financial.recurringExpenseTemplates.length}{" "}
              recurring
            </span>
          </div>

          <div className="admin-panel-section">
              <h3>Categories</h3>
              <div className="quick-edit-list">
                {financial.expenseCategories.map((category) => (
                  <TaxonomyRow
                    action={quickEditExpenseCategoryAction}
                    active={category.active}
                    disabled={disabled}
                    id={category.id}
                    key={category.id}
                    slug={category.slug}
                    sortOrder={category.sortOrder}
                    title={category.title}
                  />
                ))}
                {financial.expenseCategories.length === 0 ? <p className="admin-help">No categories yet.</p> : null}
              </div>
              <div className="admin-panel-section">
                <CreateExpenseCategoryForm action={createExpenseCategoryAction} disabled={disabled} />
              </div>
            </div>

            <div className="admin-panel-section">
              <h3>Recurring expenses</h3>
              <div className="stack-list">
                {financial.recurringExpenseTemplates.map((template) => (
                  <RecurringExpenseRow
                    amountLabel={formatMoney(template.amount)}
                    categoryTitle={categoriesById.get(template.categoryId)?.title ?? "Uncategorized"}
                    currentPeriod={period}
                    dayOfMonth={template.dayOfMonth}
                    deleteAction={deleteRecurringExpenseTemplateAction}
                    disabled={disabled}
                    key={template.id}
                    label={template.label}
                    lastLoggedPeriod={template.lastLoggedPeriod ?? null}
                    logAction={logRecurringExpenseAction}
                    templateId={template.id}
                  />
                ))}
                {financial.recurringExpenseTemplates.length === 0 ? (
                  <p className="admin-help">Nothing recurring set up yet — rent, salaries, subscriptions.</p>
                ) : null}
              </div>
              {financial.expenseCategories.length > 0 ? (
                <div className="admin-panel-section">
                  <CreateRecurringExpenseForm
                    action={createRecurringExpenseTemplateAction}
                    categories={financial.expenseCategories}
                    disabled={disabled}
                  />
                </div>
              ) : null}
            </div>
        </section>
      </Fragment>
    );
  }

  if (canSeeAssets) {
    const totalPurchaseCost = financial.capitalAssets.reduce((total, asset) => total + asset.purchaseCost, 0);
    const totalBookValue = financial.capitalAssets.reduce((total, asset) => total + computeAssetBookValue(asset), 0);

    setupSections.push(
      <Fragment key="asset-setup">
        <section className="admin-panel">
          <div className="panel-header">
            <h2>Assets</h2>
            <span>{financial.capitalAssets.length} assets</span>
          </div>
          <p className="admin-help">
            Equipment, furniture, machines, and everything else the business owns. Registered once, then
            depreciated automatically — this is capital value, not a monthly cost, so it never touches the P&amp;L.
          </p>
          <div className="metric-grid">
            <article className="metric">
              <span>Total purchase cost</span>
              <strong>{formatMoney(totalPurchaseCost)}</strong>
            </article>
            <article className="metric">
              <span>Current book value</span>
              <strong>{formatMoney(totalBookValue)}</strong>
            </article>
          </div>
          <div className="admin-panel-footer-row">
            <span />
            <AdminDrawer title="Add an asset" triggerLabel="Add asset">
              <CreateAssetForm action={createCapitalAssetAction} disabled={disabled} />
            </AdminDrawer>
          </div>
        </section>

        <section className="admin-panel">
            <div className="panel-header">
              <h2>Asset register</h2>
              <span>Tap one to edit or remove it</span>
            </div>
            <div className="order-list">
              {financial.capitalAssets.map((asset) => {
                const bookValue = computeAssetBookValue(asset);
                return (
                  <AssetRow
                    assetId={asset.id}
                    bookValueLabel={asset.trackDepreciation ? formatMoney(bookValue) : null}
                    category={asset.category}
                    categoryLabel={ASSET_CATEGORY_LABELS[asset.category] ?? asset.category}
                    deleteAction={deleteCapitalAssetAction}
                    disabled={disabled}
                    key={asset.id}
                    location={asset.location}
                    name={asset.name}
                    notes={asset.notes}
                    purchaseCostLabel={formatMoney(asset.purchaseCost)}
                    purchaseCostValue={(asset.purchaseCost / 100).toFixed(2)}
                    purchaseDateLabel={formatDateLabel(asset.purchaseDate)}
                    purchaseDateValue={toDateInputValue(asset.purchaseDate)}
                    trackDepreciation={asset.trackDepreciation}
                    updateAction={updateCapitalAssetAction}
                    usefulLifeYears={asset.usefulLifeYears ?? null}
                  />
                );
              })}
              {financial.capitalAssets.length === 0 ? <p className="admin-help">Nothing added yet.</p> : null}
            </div>
        </section>
      </Fragment>
    );
  }

  if (canSeePayroll) {
    const period = currentPeriod();
    const activeWorkers = financial.workers.filter((worker) => worker.status === "ACTIVE");
    const paymentsThisPeriod = new Map(
      financial.payrollPayments.filter((payment) => payment.period === period).map((payment) => [payment.workerId, payment])
    );
    const workersById = new Map(financial.workers.map((worker) => [worker.id, worker]));
    const recentPayments = financial.payrollPayments.slice(0, 50);
    const totalMonthlyPayroll = activeWorkers.reduce((total, worker) => total + worker.monthlySalary, 0);
    const paidThisPeriod = financial.payrollPayments
      .filter((payment) => payment.period === period)
      .reduce((total, payment) => total + payment.grossAmount, 0);

    tabs.push({
      id: "payroll",
      label: "Payroll",
      content: (
        <>
          {payrollAccrual.outstanding > 0 ? (
            <div className="admin-alert" role="status">
              {formatMoney(payrollAccrual.outstanding)} of payroll isn&apos;t recorded for {period} yet, so it is
              not in this month&apos;s profit &amp; loss. Salaries only count once you record the payment below.
            </div>
          ) : null}

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Overview</h2>
              <span>{activeWorkers.length} active workers</span>
            </div>
            <div className="metric-grid">
              <article className="metric">
                <span>Monthly payroll (active workers)</span>
                <strong>{formatMoney(totalMonthlyPayroll)}</strong>
              </article>
              <article className="metric">
                <span>Recorded for {period}</span>
                <strong>{formatMoney(paidThisPeriod)}</strong>
              </article>
              <article className="metric">
                <span>Still to record</span>
                <strong>{formatMoney(payrollAccrual.outstanding)}</strong>
              </article>
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Run payroll — {period}</h2>
              <span>{paymentsThisPeriod.size} of {activeWorkers.length} paid</span>
            </div>
            <div className="stack-list">
              {activeWorkers.map((worker) => {
                const existing = paymentsThisPeriod.get(worker.id);
                return (
                  <PayWorkerForm
                    action={payWorkerAction}
                    alreadyPaid={Boolean(existing)}
                    defaultGrossValue={((existing?.grossAmount ?? worker.monthlySalary) / 100).toFixed(2)}
                    disabled={disabled}
                    key={worker.id}
                    period={period}
                    workerId={worker.id}
                    workerName={worker.name}
                  />
                );
              })}
              {activeWorkers.length === 0 ? (
                <p className="admin-help">Add a worker under the Setup tab to start running payroll.</p>
              ) : null}
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Payment history</h2>
              <span>{financial.payrollPayments.length} payments</span>
            </div>
            <div className="stack-list">
              {recentPayments.map((payment) => (
                <PayrollHistoryRow
                  deleteAction={deletePayrollPaymentAction}
                  disabled={disabled}
                  key={payment.id}
                  netLabel={formatMoney(payment.netAmount)}
                  paidDateLabel={formatDateLabel(payment.paidDate)}
                  paymentId={payment.id}
                  period={payment.period}
                  workerName={workersById.get(payment.workerId)?.name ?? "Former worker"}
                />
              ))}
              {recentPayments.length === 0 ? <p className="admin-help">No payments logged yet.</p> : null}
            </div>
          </section>
        </>
      )
    });

    setupSections.push(
      <Fragment key="payroll-setup">
        <section className="admin-panel">
            <div className="panel-header">
              <h2>Workers</h2>
              <span>{financial.workers.length} total</span>
            </div>
            <div className="order-list">
              {financial.workers.map((worker) => (
                <WorkerRow
                  bankAccountNumber={worker.bankAccountNumber}
                  bankName={worker.bankName}
                  deleteAction={deleteWorkerAction}
                  disabled={disabled}
                  emergencyContactName={worker.emergencyContactName}
                  emergencyContactPhone={worker.emergencyContactPhone}
                  ghanaCardNumber={worker.ghanaCardNumber}
                  key={worker.id}
                  momoNetwork={worker.momoNetwork}
                  momoNumber={worker.momoNumber}
                  monthlySalaryValue={(worker.monthlySalary / 100).toFixed(2)}
                  name={worker.name}
                  nextOfKinName={worker.nextOfKinName}
                  nextOfKinPhone={worker.nextOfKinPhone}
                  nextOfKinRelationship={worker.nextOfKinRelationship}
                  notes={worker.notes}
                  parentGuardianName={worker.parentGuardianName}
                  phone={worker.phone}
                  role={worker.role}
                  salaryLabel={formatMoney(worker.monthlySalary)}
                  siblingsInfo={worker.siblingsInfo}
                  startDateValue={worker.startDate ? toDateInputValue(worker.startDate) : undefined}
                  status={worker.status}
                  updateAction={updateWorkerAction}
                  workerId={worker.id}
                />
              ))}
              {financial.workers.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
            </div>
            <p className="admin-help">
              Worker profiles carry national ID and bank details, and set the monthly salary each payroll run
              starts from. Owner-only.
            </p>
            <div className="admin-panel-footer-row">
              <span />
              <AdminDrawer title="Add a worker" triggerLabel="Add worker">
                <CreateWorkerForm action={createWorkerAction} disabled={disabled} />
              </AdminDrawer>
            </div>
        </section>
      </Fragment>
    );
  }

  tabs.push({ id: "reports", label: "Reports", content: reportsTab });

  if (setupSections.length > 0) {
    tabs.push({
      id: "setup",
      label: "Setup",
      content: (
        <>
          <div className="admin-alert" role="status">
            One-time configuration. Set these up once and the day-to-day tabs stay simple.
          </div>
          {setupSections}
        </>
      )
    });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Financial</h1>
          <p className="app-subtitle">
            Money in, money out, and what it leaves you. Statements print from Reports; categories, workers, and
            assets are configured under Setup.
          </p>
        </div>
      </div>
      <AdminTabs initialTabId={tab} tabs={tabs} />
    </>
  );
}
