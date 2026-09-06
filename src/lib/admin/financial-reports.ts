import { toSortableMillis, type AdminOrderRow } from "@/lib/admin/operations-data";
import type { Expense, ExpenseCategory, ManualRevenueEntry, PayrollPayment, Worker } from "@/lib/commerce/types";

export type PnlReport = {
  label: string;
  orderCount: number;
  /** Goods sold, after line discounts — the actual trading income. */
  productRevenue: number;
  /** Delivery charged to customers. Income, but not from selling product. */
  deliveryRevenue: number;
  /**
   * The Paystack fee customers are charged on top of their order. It really
   * does arrive, so it is income — and it is handed straight to Paystack, so
   * the identical amount appears as a cost below. Shown on both sides rather
   * than netted off, because "what did card payments cost me" is a question
   * worth being able to answer.
   */
  paymentFeeRevenue: number;
  /** Manually logged income — equipment sold, refunds received, and so on. */
  otherRevenue: number;
  /** Every order line combined. Kept for callers that only want one number. */
  ordersRevenue: number;
  /** Total income: product + delivery + payment fees + other. Excludes tax. */
  revenue: number;
  /**
   * Sales tax collected on behalf of the tax authority. Deliberately NOT in
   * revenue — it is money held and owed, never the business's to keep.
   */
  taxCollected: number;
  /** Paid to Paystack. Always equals paymentFeeRevenue; nets to zero on profit. */
  paymentFees: number;
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
 * Cash-basis P&L: income is what actually came in, costs are what actually
 * went out, both dated by when the money moved.
 *
 * An order's `total` is subtotal − discounts + delivery + tax + payment fee,
 * so it cannot be used as revenue directly: tax belongs to the tax authority
 * and the payment fee belongs to Paystack. Summing `total` treated both as
 * profit. This splits the order into its parts instead, keeps tax out of
 * revenue entirely, and books the payment fee on both sides so it shows up
 * as a real cost rather than quietly inflating the bottom line.
 *
 * Raw-material purchases stay in `expenses` and are deliberately NOT the
 * recipe-based COGS used by the product margin reference — that answers a
 * pricing question, and subtracting it here too would double-count.
 */
export function buildPnlReport(label: string, data: PnlInput, sinceMillis: number, untilMillis: number): PnlReport {
  const inRange = (millis: number) => millis >= sinceMillis && millis <= untilMillis;

  const paidInPeriod = data.orderRows.filter(
    (row) => row.order.paymentStatus === "PAID" && inRange(toSortableMillis(row.order.createdAt))
  );

  let productRevenue = 0;
  let deliveryRevenue = 0;
  let paymentFeeRevenue = 0;
  let taxCollected = 0;
  for (const { order } of paidInPeriod) {
    productRevenue += order.subtotal - order.discountTotal;
    deliveryRevenue += order.deliveryTotal;
    paymentFeeRevenue += order.paymentFeeTotal;
    taxCollected += order.taxTotal;
  }

  const otherRevenue = data.manualRevenueEntries
    .filter((entry) => inRange(new Date(entry.date).getTime()))
    .reduce((total, entry) => total + entry.amount, 0);
  const expensesTotal = data.expenses
    .filter((expense) => inRange(new Date(expense.date).getTime()))
    .reduce((total, expense) => total + expense.amount, 0);
  const payrollTotal = data.payrollPayments
    .filter((payment) => inRange(new Date(payment.paidDate).getTime()))
    .reduce((total, payment) => total + payment.grossAmount, 0);

  const ordersRevenue = productRevenue + deliveryRevenue + paymentFeeRevenue;
  const revenue = ordersRevenue + otherRevenue;
  const paymentFees = paymentFeeRevenue;

  return {
    label,
    orderCount: paidInPeriod.length,
    productRevenue,
    deliveryRevenue,
    paymentFeeRevenue,
    otherRevenue,
    ordersRevenue,
    revenue,
    taxCollected,
    paymentFees,
    expenses: expensesTotal,
    payroll: payrollTotal,
    netProfit: revenue - paymentFees - expensesTotal - payrollTotal
  };
}

export type ChannelTotal = {
  channel: string;
  orders: number;
  revenue: number;
};

/**
 * Paid revenue per sales channel within a period. Previously computed with
 * no date bound at all while sitting under a heading showing the month's
 * revenue, so the total and the bars silently described different spans of
 * time. Uses the same product + delivery + fee basis as buildPnlReport so
 * the two agree.
 */
export function buildChannelTotals(
  orderRows: AdminOrderRow[],
  channels: readonly string[],
  sinceMillis: number,
  untilMillis: number
): ChannelTotal[] {
  return channels.map((channel) => {
    const orders = orderRows.filter((row) => {
      const millis = toSortableMillis(row.order.createdAt);
      return (
        row.order.channel === channel &&
        row.order.paymentStatus === "PAID" &&
        millis >= sinceMillis &&
        millis <= untilMillis
      );
    });

    return {
      channel,
      orders: orders.length,
      revenue: orders.reduce(
        (total, { order }) => total + (order.subtotal - order.discountTotal) + order.deliveryTotal + order.paymentFeeTotal,
        0
      )
    };
  });
}

export type MonthOption = {
  /** "2026-09" — also the payroll period key. */
  key: string;
  label: string;
  sinceMillis: number;
  untilMillis: number;
};

/**
 * The last `count` months, newest first, for the period selector. Owners ask
 * "how did September go" far more often than "how did the last 30 days go",
 * and a rolling window can't answer that.
 */
export function buildMonthOptions(now: Date, count = 12): MonthOption[] {
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1);

    return {
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
      sinceMillis: start.getTime(),
      untilMillis: end.getTime()
    };
  });
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

export type PayrollAccrual = {
  period: string;
  expected: number;
  recorded: number;
  outstanding: number;
  workerCount: number;
  unpaidWorkerCount: number;
};

/**
 * Payroll only reaches the P&L once a payment is actually recorded — the
 * cash-basis rule the rest of this report follows. That is correct, but it
 * silently flatters a month whose salaries simply haven't been entered yet,
 * so this reports what the active roster is expected to cost against what
 * has been recorded. The gap is surfaced as a warning next to net profit
 * rather than subtracted, since subtracting it would double-count the
 * moment the payment is logged.
 */
export function buildPayrollAccrual(
  workers: Worker[],
  payrollPayments: PayrollPayment[],
  period: string
): PayrollAccrual {
  const activeWorkers = workers.filter((worker) => worker.status === "ACTIVE");
  const expected = activeWorkers.reduce((total, worker) => total + worker.monthlySalary, 0);
  const paymentsThisPeriod = payrollPayments.filter((payment) => payment.period === period);
  const recorded = paymentsThisPeriod.reduce((total, payment) => total + payment.grossAmount, 0);
  const paidWorkerIds = new Set(paymentsThisPeriod.map((payment) => payment.workerId));

  return {
    period,
    expected,
    recorded,
    outstanding: Math.max(0, expected - recorded),
    workerCount: activeWorkers.length,
    unpaidWorkerCount: activeWorkers.filter((worker) => !paidWorkerIds.has(worker.id)).length
  };
}

/** "2026-09" for whatever month the given date falls in — the payroll period key. */
export function periodKeyFor(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getPeriodBoundaries() {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const startOfPreviousMonth = new Date(startOfMonth);
  startOfPreviousMonth.setUTCMonth(startOfPreviousMonth.getUTCMonth() - 1);

  return {
    now,
    startOfToday: startOfToday.getTime(),
    startOfMonth: startOfMonth.getTime(),
    startOfPreviousMonth: startOfPreviousMonth.getTime(),
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
