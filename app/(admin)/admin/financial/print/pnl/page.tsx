import { requireAdminPermission } from "@/lib/auth/server";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getAdminOperationsData, formatMoney } from "@/lib/admin/operations-data";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { buildPnlReport, getPeriodBoundaries, parseCustomRange } from "@/lib/admin/financial-reports";
import { PrintPageButton } from "@/components/admin/print-page-button";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
};

function resolvePeriod(period: string | undefined, from: string | undefined, to: string | undefined) {
  const { now, startOfToday, sevenDaysAgo, thirtyDaysAgo } = getPeriodBoundaries();
  const custom = parseCustomRange(from, to);

  if (custom) {
    return { label: `${custom.from} to ${custom.to}`, sinceMillis: custom.sinceMillis, untilMillis: custom.untilMillis };
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
  const { period, from, to } = await searchParams;

  const context = getCommerceServerContext();
  const [operations, financial, storeSettings] = await Promise.all([
    getAdminOperationsData(),
    getAdminFinancialData(),
    context ? context.repo.getStoreSettings().catch(() => null) : Promise.resolve(null)
  ]);

  const { label, sinceMillis, untilMillis } = resolvePeriod(period, from, to);
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
            <span>Sales (orders paid)</span>
            <span>{formatMoney(report.ordersRevenue)}</span>
          </div>
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

        <div className="statement-section">
          <h2>Expenses</h2>
          <div className="statement-total-row">
            <span>Total expenses</span>
            <span>{formatMoney(report.expenses)}</span>
          </div>
        </div>

        {report.payroll > 0 ? (
          <div className="statement-section">
            <h2>Payroll</h2>
            <div className="statement-total-row">
              <span>Total payroll</span>
              <span>{formatMoney(report.payroll)}</span>
            </div>
          </div>
        ) : null}

        <div className="statement-net-row">
          <span>Net profit</span>
          <span>{formatMoney(report.netProfit)}</span>
        </div>

        <p className="statement-footnote">
          {report.orderCount} paid order{report.orderCount === 1 ? "" : "s"} in this period. Generated {generatedOn}.
        </p>
      </div>
    </main>
  );
}
