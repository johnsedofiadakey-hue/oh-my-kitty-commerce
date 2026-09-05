import Link from "next/link";
import type { Route } from "next";
import {
  formatMoney,
  getAdminOperationsData,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { buildPnlReport, getPeriodBoundaries, parseCustomRange } from "@/lib/admin/financial-reports";
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
  ExpenseRow,
  RecurringExpenseRow
} from "@/components/admin/expense-forms";
import { AssetRow, CreateAssetForm } from "@/components/admin/asset-forms";
import { CreateWorkerForm, PayWorkerForm, PayrollHistoryRow, WorkerRow } from "@/components/admin/worker-forms";
import type { AdminOrderRow } from "@/lib/admin/operations-data";
import { createManualRevenueEntryAction, deleteManualRevenueEntryAction } from "./actions";
import {
  createExpenseAction,
  createExpenseCategoryAction,
  createRecurringExpenseTemplateAction,
  deleteExpenseAction,
  deleteRecurringExpenseTemplateAction,
  logRecurringExpenseAction,
  quickEditExpenseCategoryAction
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
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toDateInputValue(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type AdminFinancialPageProps = {
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>;
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

  const { from, to, tab } = await searchParams;
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

  const overviewTab = (
    <>
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
        <section className="admin-panel" key={period.key}>
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
          <div className="admin-panel-footer-row">
            <p className="admin-help">
              Revenue is {formatMoney(period.ordersRevenue)} from orders
              {period.otherRevenue > 0 ? ` + ${formatMoney(period.otherRevenue)} other income` : ""}.
            </p>
            <Link className="text-button" href={`/admin/financial/print/pnl?period=${period.key}` as Route} target="_blank">
              Print statement
            </Link>
          </div>
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
            <div className="admin-panel-footer-row">
              <p className="admin-help">{customPeriod.orderCount} paid order{customPeriod.orderCount === 1 ? "" : "s"}.</p>
              <Link className="text-button" href={`/admin/financial/print/pnl?from=${from}&to=${to}` as Route} target="_blank">
                Print statement
              </Link>
            </div>
          </>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Other income</h2>
          <AdminDrawer title="Log other income" triggerLabel="Log income">
            <CreateManualRevenueForm action={createManualRevenueEntryAction} disabled={disabled} />
          </AdminDrawer>
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

  const tabs: AdminTabSpec[] = [
    { id: "overview", label: "Overview", content: overviewTab },
    { id: "reports", label: "Reports", content: reportsTab }
  ];

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
              Add a category first — open &quot;Manage categories &amp; recurring&quot; below.
            </div>
          ) : null}

          <section className="admin-panel">
            <div className="panel-header">
              <h2>All expenses</h2>
              <span>{financial.expenses.length} logged &middot; {formatMoney(allExpensesTotal)} total</span>
            </div>
            {financial.expenseCategories.length > 0 ? (
              <div className="admin-panel-section">
                <CreateExpenseForm action={createExpenseAction} categories={financial.expenseCategories} disabled={disabled} />
              </div>
            ) : null}
            <div className="stack-list">
              {financial.expenses.map((expense) => (
                <ExpenseRow
                  amountLabel={formatMoney(expense.amount)}
                  categoryTitle={categoriesById.get(expense.categoryId)?.title ?? "Uncategorized"}
                  dateLabel={formatDateLabel(expense.date)}
                  deleteAction={deleteExpenseAction}
                  disabled={disabled}
                  expenseId={expense.id}
                  isRecurring={Boolean(expense.recurringTemplateId)}
                  key={expense.id}
                  note={expense.note}
                />
              ))}
              {financial.expenses.length === 0 ? <p className="admin-help">Nothing logged yet.</p> : null}
            </div>
            <div className="admin-panel-footer-row">
              <span />
              <Link className="text-button" href={"/admin/financial/print/expenses?period=all" as Route} target="_blank">
                Print all-time expense report
              </Link>
            </div>
          </section>

          <details className="admin-panel admin-collapsible">
            <summary className="panel-header">
              <h2>Manage categories &amp; recurring</h2>
              <span>
                {financial.expenseCategories.length} categories &middot; {financial.recurringExpenseTemplates.length}{" "}
                recurring
              </span>
            </summary>

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
          </details>
        </>
      )
    });
  }

  if (canSeeAssets) {
    const totalPurchaseCost = financial.capitalAssets.reduce((total, asset) => total + asset.purchaseCost, 0);
    const totalBookValue = financial.capitalAssets.reduce((total, asset) => total + computeAssetBookValue(asset), 0);

    tabs.push({
      id: "assets",
      label: "Assets",
      content: (
        <>
          <div className="page-heading">
            <div>
              <p className="app-subtitle">Equipment, furniture, machines, and everything else the business owns.</p>
            </div>
            <AdminDrawer title="Add an asset" triggerLabel="Add asset">
              <CreateAssetForm action={createCapitalAssetAction} disabled={disabled} />
            </AdminDrawer>
          </div>

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Overview</h2>
              <span>{financial.capitalAssets.length} assets</span>
            </div>
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
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Register</h2>
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
        </>
      )
    });
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
          <div className="page-heading">
            <div>
              <p className="app-subtitle">Worker profiles and monthly pay. Owner-only — this carries national ID and bank details.</p>
            </div>
            <AdminDrawer title="Add a worker" triggerLabel="Add worker">
              <CreateWorkerForm action={createWorkerAction} disabled={disabled} />
            </AdminDrawer>
          </div>

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
                <span>Paid for {period}</span>
                <strong>{formatMoney(paidThisPeriod)}</strong>
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
              {activeWorkers.length === 0 ? <p className="admin-help">Add a worker below to start running payroll.</p> : null}
            </div>
          </section>

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
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Financial</h1>
          <p className="app-subtitle">
            Revenue, expenses, assets, and payroll — with printable statements under Reports.
          </p>
        </div>
      </div>
      <AdminTabs initialTabId={tab} tabs={tabs} />
    </>
  );
}
