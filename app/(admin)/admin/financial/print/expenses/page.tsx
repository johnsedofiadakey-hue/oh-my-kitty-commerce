import { requireAdminPermission } from "@/lib/auth/server";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { formatMoney, toRealDate } from "@/lib/admin/operations-data";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { buildExpensesByCategory, getPeriodBoundaries, parseCustomRange } from "@/lib/admin/financial-reports";
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

export default async function PrintExpenseReportPage({ searchParams }: PageProps) {
  await requireAdminPermission("expenses.view");
  const { period, from, to } = await searchParams;

  const context = getCommerceServerContext();
  const [financial, storeSettings] = await Promise.all([
    getAdminFinancialData(),
    context ? context.repo.getStoreSettings().catch(() => null) : Promise.resolve(null)
  ]);

  const { label, sinceMillis, untilMillis } = resolvePeriod(period, from, to);
  const report = buildExpensesByCategory(financial.expenses, financial.expenseCategories, sinceMillis, untilMillis);
  const categoriesById = new Map(financial.expenseCategories.map((category) => [category.id, category]));
  const lineItems = financial.expenses
    .filter((expense) => {
      const millis = toRealDate(expense.date)?.getTime() ?? NaN;
      return millis >= sinceMillis && millis <= untilMillis;
    })
    .sort((a, b) => (toRealDate(a.date)?.getTime() ?? 0) - (toRealDate(b.date)?.getTime() ?? 0));
  const storeName = storeSettings?.storeName ?? "Oh My Kitty";
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="statement-page">
      <PrintPageButton label="Print report" />
      <div className="statement-paper">
        <div className="statement-header">
          <h1>{storeName}</h1>
          <p>Expense Report</p>
          <p>{label}</p>
        </div>

        <div className="statement-section">
          <h2>By category</h2>
          {report.rows.map((row) => (
            <div className="statement-row indent" key={row.categoryId}>
              <span>
                {row.categoryTitle} ({row.count})
              </span>
              <span>{formatMoney(row.total)}</span>
            </div>
          ))}
          {report.rows.length === 0 ? <p className="statement-footnote">No expenses logged in this period.</p> : null}
          <div className="statement-total-row">
            <span>Total expenses</span>
            <span>{formatMoney(report.total)}</span>
          </div>
        </div>

        {lineItems.length > 0 ? (
          <div className="statement-section">
            <h2>Detail</h2>
            {lineItems.map((expense) => (
              <div className="statement-row indent" key={expense.id}>
                <span>
                  {toRealDate(expense.date)?.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) ?? "—"}
                  {"  "}
                  {expense.name || categoriesById.get(expense.categoryId)?.title || "Expense"}
                  {expense.name ? ` — ${categoriesById.get(expense.categoryId)?.title ?? "Uncategorized"}` : ""}
                </span>
                <span>{formatMoney(expense.amount)}</span>
              </div>
            ))}
          </div>
        ) : null}

        <p className="statement-footnote">
          {report.count} expense{report.count === 1 ? "" : "s"} in this period. Generated {generatedOn}.
        </p>
      </div>
    </main>
  );
}
