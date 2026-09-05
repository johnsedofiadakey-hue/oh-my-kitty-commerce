import { toSortableMillis, type AdminOrderRow } from "@/lib/admin/operations-data";
import type { Expense, ExpenseCategory, ManualRevenueEntry, PayrollPayment } from "@/lib/commerce/types";

export type PnlReport = {
  label: string;
  orderCount: number;
  ordersRevenue: number;
  otherRevenue: number;
  revenue: number;
  expenses: number;
  payroll: number;
  netProfit: number;
};

export type PnlInput = {
  orderRows: AdminOrderRow[];
  expenses: Expense[];
  payrollPayments: PayrollPayment[];
  manualRevenueEntries: ManualRevenueEntry[];
};

/**
 * Cash-basis P&L: revenue is what actually came in (orders + logged other
 * income), expenses is everything spent (including raw-material purchases —
 * deliberately NOT the recipe-based COGS used in the product margin
 * reference, which answers a different question — pricing, not cash flow —
 * and would double-count against this if subtracted here too).
 */
export function buildPnlReport(label: string, data: PnlInput, sinceMillis: number, untilMillis: number): PnlReport {
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

export type ExpenseCategoryTotal = {
  categoryId: string;
  categoryTitle: string;
  total: number;
  count: number;
};

export function buildExpensesByCategory(
  expenses: Expense[],
  categories: ExpenseCategory[],
  sinceMillis: number,
  untilMillis: number
): { rows: ExpenseCategoryTotal[]; total: number; count: number } {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const inPeriod = expenses.filter((expense) => {
    const millis = new Date(expense.date).getTime();
    return millis >= sinceMillis && millis <= untilMillis;
  });

  const byCategory = new Map<string, ExpenseCategoryTotal>();
  for (const expense of inPeriod) {
    const title = categoriesById.get(expense.categoryId)?.title ?? "Uncategorized";
    const existing = byCategory.get(expense.categoryId);
    if (existing) {
      existing.total += expense.amount;
      existing.count += 1;
    } else {
      byCategory.set(expense.categoryId, {
        categoryId: expense.categoryId,
        categoryTitle: title,
        total: expense.amount,
        count: 1
      });
    }
  }

  const rows = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.total, 0),
    count: inPeriod.length
  };
}

export function getPeriodBoundaries() {
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

export function parseCustomRange(from: string | undefined, to: string | undefined) {
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
