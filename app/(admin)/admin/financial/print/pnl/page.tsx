import { requireAdminPermission } from "@/lib/auth/server";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getAdminOperationsData, formatMoney } from "@/lib/admin/operations-data";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import {
  buildExpensesByCategory,
  buildMonthOptions,
  buildPayrollAccrual,
  buildPnlReport,
  getPeriodBoundaries,
  parseCustomRange,
  periodKeyFor
} from "@/lib/admin/financial-reports";
import { PrintPageButton } from "@/components/admin/print-page-button";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ period?: string; from?: string; to?: string; month?: string }>;
};

function resolvePeriod(
  period: string | undefined,
  from: string | undefined,
  to: string | undefined,
  month: string | undefined
) {
  const { now, startOfToday, startOfMonth, sevenDaysAgo, thirtyDaysAgo } = getPeriodBoundaries();
  const custom = parseCustomRange(from, to);

  if (custom) {
    return { label: `${custom.from} to ${custom.to}`, sinceMillis: custom.sinceMillis, untilMillis: custom.untilMillis };
  }
  // A specific month picked on the dashboard, so the printed statement covers
  // the same period the screen was showing.
  if (month) {
    const selected = buildMonthOptions(new Date(now), 24).find((option) => option.key === month);
    if (selected) {
      return {
        label: selected.label,
        sinceMillis: selected.sinceMillis,
        untilMillis: Math.min(selected.untilMillis, now)
      };
    }
  }
  if (period === "month") {
    return { label: "This month", sinceMillis: startOfMonth, untilMillis: now };
  }
  if (period === "today") {
    return { label: "Today", sinceMillis: startOfToday, untilMillis: now };
  }
  if (period === "all") {
    return { label: "All time", sinceMillis: 0, untilMillis: now };
  }
  if (period === "7d") {
    return { label: "Last 7 days", sinceMillis: sevenDaysAgo, untilMillis: now };
  }
  return { label: "Last 30 days", sinceMillis: thirtyDaysAgo, untilMillis: now };
}

export default async function PrintPnlPage({ searchParams }: PageProps) {
  await requireAdminPermission("reports.financial");
  const { period, from, to, month } = await searchParams;

  const context = getCommerceServerContext();
  const [operations, financial, storeSettings] = await Promise.all([
    getAdminOperationsData(),
    getAdminFinancialData(),
    context ? context.repo.getStoreSettings().catch(() => null) : Promise.resolve(null)
  ]);

  const { label, sinceMillis, untilMillis } = resolvePeriod(period, from, to, month);
  const report = buildPnlReport(
    label,
    {
      orderRows: operations.orderRows,
      expenses: financial.expenses,
      payrollPayments: financial.payrollPayments,
      manualRevenueEntries: financial.manualRevenueEntries
    },
    sinceMillis,
    untilMillis
  );
  const expenseBreakdown = buildExpensesByCategory(
    financial.expenses,
    financial.expenseCategories,
    sinceMillis,
    untilMillis
  );
  // Only relevant when the statement covers the month payroll is still being
  // recorded for — a closed past month has nothing left to record.
  const { startOfMonth } = getPeriodBoundaries();
  const payrollAccrual =
    untilMillis >= startOfMonth
      ? buildPayrollAccrual(financial.workers, financial.payrollPayments, periodKeyFor(new Date()))
      : null;
  const storeName = storeSettings?.storeName ?? "Oh My Kitty";
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="statement-page">
      <PrintPageButton label="Print statement" />
      <div className="statement-paper">
        <div className="statement-header">
          <h1>{storeName}</h1>
          <p>Profit &amp; Loss Statement</p>
          <p>{report.label}</p>
        </div>

        <div className="statement-section">
          <h2>Income</h2>
          <div className="statement-row indent">
            <span>Product sales</span>
            <span>{formatMoney(report.productRevenue)}</span>
          </div>
          {report.deliveryRevenue > 0 ? (
            <div className="statement-row indent">
              <span>Delivery charged</span>
              <span>{formatMoney(report.deliveryRevenue)}</span>
            </div>
          ) : null}
          {report.paymentFeeRevenue > 0 ? (
            <div className="statement-row indent">
              <span>Payment fees collected</span>
              <span>{formatMoney(report.paymentFeeRevenue)}</span>
            </div>
          ) : null}
          {report.otherRevenue > 0 ? (
            <div className="statement-row indent">
              <span>Other income</span>
              <span>{formatMoney(report.otherRevenue)}</span>
            </div>
          ) : null}
          <div className="statement-total-row">
            <span>Total income</span>
            <span>{formatMoney(report.revenue)}</span>
          </div>
        </div>

        {report.paymentFees > 0 ? (
          <div className="statement-section">
            <h2>Cost of taking payment</h2>
            <div className="statement-row indent">
              <span>Paystack fees</span>
              <span>{formatMoney(report.paymentFees)}</span>
            </div>
            <div className="statement-total-row">
              <span>Total payment costs</span>
              <span>{formatMoney(report.paymentFees)}</span>
            </div>
          </div>
        ) : null}

        <div className="statement-section">
          <h2>Expenses</h2>
          {expenseBreakdown.rows.map((row) => (
            <div className="statement-row indent" key={row.categoryId}>
              <span>{row.categoryTitle}</span>
              <span>{formatMoney(row.total)}</span>
            </div>
          ))}
          {expenseBreakdown.rows.length === 0 ? (
            <div className="statement-row indent">
              <span>No expenses logged</span>
              <span>{formatMoney(0)}</span>
            </div>
          ) : null}
          <div className="statement-total-row">
            <span>Total expenses</span>
            <span>{formatMoney(report.expenses)}</span>
          </div>
        </div>

        <div className="statement-section">
          <h2>Payroll</h2>
          <div className="statement-total-row">
            <span>Total payroll recorded</span>
            <span>{formatMoney(report.payroll)}</span>
          </div>
        </div>

        <div className="statement-net-row">
          <span>Net profit</span>
          <span>{formatMoney(report.netProfit)}</span>
        </div>

        {report.taxCollected > 0 ? (
          <p className="statement-footnote">
            Sales tax collected in this period: {formatMoney(report.taxCollected)}. Held on behalf of the tax
            authority and excluded from income above — it is owed, not earned.
          </p>
        ) : null}

        <p className="statement-footnote">
          {report.orderCount} paid order{report.orderCount === 1 ? "" : "s"} in this period. Prepared on a cash
          basis — income and costs count on the date they were received or paid. Payment fees appear on both
          sides: charged to the customer, then paid to Paystack, so they do not change net profit. Generated{" "}
          {generatedOn}.
        </p>
        {payrollAccrual && payrollAccrual.outstanding > 0 ? (
          <p className="statement-footnote">
            Note: {formatMoney(payrollAccrual.outstanding)} of payroll for {payrollAccrual.period} has not been
            recorded yet and is therefore not included above. Net profit will fall by that amount once it is.
          </p>
        ) : null}
      </div>
    </main>
  );
}
