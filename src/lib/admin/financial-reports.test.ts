import { describe, expect, it } from "vitest";
import {
  buildChannelTotals,
  buildMonthOptions,
  buildPayrollAccrual,
  buildPnlReport,
  periodKeyFor
} from "@/lib/admin/financial-reports";
import type { AdminOrderRow } from "@/lib/admin/operations-data";
import type { Order, PayrollPayment, Worker } from "@/lib/commerce/types";

/** A paid order with each money component set independently, so the P&L split can be asserted. */
function orderRow(
  overrides: Partial<Order> & { createdAt: Date }
): AdminOrderRow {
  const order = {
    id: "order-1",
    orderNumber: "OMK-1",
    channel: "ONLINE",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    fulfilmentStatus: "PROCESSING",
    items: [],
    subtotal: 0,
    discountTotal: 0,
    deliveryTotal: 0,
    taxTotal: 0,
    paymentFeeTotal: 0,
    total: 0,
    currency: "GHS",
    idempotencyKey: "key-1",
    ...overrides
  } as Order;

  return { order, payment: null } as unknown as AdminOrderRow;
}

function worker(id: string, monthlySalary: number, status: Worker["status"] = "ACTIVE"): Worker {
  return { id, name: id, status, monthlySalary };
}

function payment(workerId: string, period: string, grossAmount: number, paidDate: Date): PayrollPayment {
  return {
    id: `pay-${workerId}-${period}`,
    workerId,
    period,
    grossAmount,
    deductions: [],
    netAmount: grossAmount,
    paidDate,
    createdBy: "owner"
  };
}

describe("buildPayrollAccrual", () => {
  const workers = [worker("a", 100_00), worker("b", 200_00), worker("c", 50_00, "INACTIVE")];

  it("ignores inactive workers when totalling what payroll should cost", () => {
    const accrual = buildPayrollAccrual(workers, [], "2026-09");
    expect(accrual.expected).toBe(300_00);
    expect(accrual.workerCount).toBe(2);
  });

  it("reports the gap between expected and recorded payroll", () => {
    const accrual = buildPayrollAccrual(workers, [payment("a", "2026-09", 100_00, new Date())], "2026-09");
    expect(accrual.recorded).toBe(100_00);
    expect(accrual.outstanding).toBe(200_00);
    expect(accrual.unpaidWorkerCount).toBe(1);
  });

  it("only counts payments belonging to the requested period", () => {
    const accrual = buildPayrollAccrual(workers, [payment("a", "2026-08", 100_00, new Date())], "2026-09");
    expect(accrual.recorded).toBe(0);
    expect(accrual.outstanding).toBe(300_00);
  });

  it("never reports a negative outstanding when payroll is overpaid", () => {
    const accrual = buildPayrollAccrual(workers, [payment("a", "2026-09", 900_00, new Date())], "2026-09");
    expect(accrual.outstanding).toBe(0);
  });
});

describe("buildPnlReport payroll handling", () => {
  const emptyInput = { orderRows: [], expenses: [], payrollPayments: [], manualRevenueEntries: [] };

  it("subtracts recorded payroll from net profit", () => {
    const paidDate = new Date("2026-09-10T00:00:00.000Z");
    const report = buildPnlReport(
      "Sept",
      { ...emptyInput, payrollPayments: [payment("a", "2026-09", 300_00, paidDate)] },
      new Date("2026-09-01T00:00:00.000Z").getTime(),
      new Date("2026-09-30T23:59:59.999Z").getTime()
    );

    expect(report.payroll).toBe(300_00);
    expect(report.netProfit).toBe(-300_00);
  });

  it("excludes payroll paid outside the reporting window", () => {
    const paidDate = new Date("2026-08-10T00:00:00.000Z");
    const report = buildPnlReport(
      "Sept",
      { ...emptyInput, payrollPayments: [payment("a", "2026-08", 300_00, paidDate)] },
      new Date("2026-09-01T00:00:00.000Z").getTime(),
      new Date("2026-09-30T23:59:59.999Z").getTime()
    );

    expect(report.payroll).toBe(0);
  });
});

describe("buildPnlReport revenue split", () => {
  const since = new Date("2026-09-01T00:00:00.000Z").getTime();
  const until = new Date("2026-09-30T23:59:59.999Z").getTime();
  const base = { expenses: [], payrollPayments: [], manualRevenueEntries: [] };

  // subtotal 1000 − discount 100 + delivery 200 + tax 50 + fee 20 = total 1170
  const richOrder = orderRow({
    createdAt: new Date("2026-09-10T00:00:00.000Z"),
    subtotal: 1000,
    discountTotal: 100,
    deliveryTotal: 200,
    taxTotal: 50,
    paymentFeeTotal: 20,
    total: 1170
  });

  it("splits an order into product, delivery, and payment-fee income", () => {
    const report = buildPnlReport("Sept", { ...base, orderRows: [richOrder] }, since, until);

    expect(report.productRevenue).toBe(900);
    expect(report.deliveryRevenue).toBe(200);
    expect(report.paymentFeeRevenue).toBe(20);
  });

  it("keeps sales tax out of income entirely", () => {
    const report = buildPnlReport("Sept", { ...base, orderRows: [richOrder] }, since, until);

    expect(report.taxCollected).toBe(50);
    expect(report.revenue).toBe(1120); // 900 + 200 + 20, tax excluded
    expect(report.revenue).not.toBe(richOrder.order.total);
  });

  it("books the payment fee as a cost so it never inflates profit", () => {
    const report = buildPnlReport("Sept", { ...base, orderRows: [richOrder] }, since, until);

    expect(report.paymentFees).toBe(20);
    // Income includes the fee and the cost removes it, so profit is the
    // product + delivery the business actually keeps.
    expect(report.netProfit).toBe(1100);
  });

  it("does not treat tax or fees as profit when they are the only difference", () => {
    const clean = orderRow({
      createdAt: new Date("2026-09-10T00:00:00.000Z"),
      subtotal: 1000,
      discountTotal: 100,
      deliveryTotal: 200,
      total: 1100
    });

    const withExtras = buildPnlReport("Sept", { ...base, orderRows: [richOrder] }, since, until);
    const withoutExtras = buildPnlReport("Sept", { ...base, orderRows: [clean] }, since, until);

    expect(withExtras.netProfit).toBe(withoutExtras.netProfit);
  });
});

describe("buildChannelTotals", () => {
  const since = new Date("2026-09-01T00:00:00.000Z").getTime();
  const until = new Date("2026-09-30T23:59:59.999Z").getTime();

  it("excludes orders outside the period", () => {
    const rows = [
      orderRow({ createdAt: new Date("2026-09-10T00:00:00.000Z"), subtotal: 500, total: 500 }),
      orderRow({ createdAt: new Date("2026-08-10T00:00:00.000Z"), subtotal: 900, total: 900 })
    ];

    const [online] = buildChannelTotals(rows, ["ONLINE"], since, until);
    expect(online.orders).toBe(1);
    expect(online.revenue).toBe(500);
  });

  it("excludes unpaid orders", () => {
    const rows = [
      orderRow({ createdAt: new Date("2026-09-10T00:00:00.000Z"), paymentStatus: "PENDING", subtotal: 500, total: 500 })
    ];

    expect(buildChannelTotals(rows, ["ONLINE"], since, until)[0].revenue).toBe(0);
  });

  it("agrees with the P&L on what an order's revenue is", () => {
    const rows = [
      orderRow({
        createdAt: new Date("2026-09-10T00:00:00.000Z"),
        subtotal: 1000,
        discountTotal: 100,
        deliveryTotal: 200,
        taxTotal: 50,
        paymentFeeTotal: 20,
        total: 1170
      })
    ];

    const channel = buildChannelTotals(rows, ["ONLINE"], since, until)[0];
    const pnl = buildPnlReport(
      "Sept",
      { orderRows: rows, expenses: [], payrollPayments: [], manualRevenueEntries: [] },
      since,
      until
    );

    expect(channel.revenue).toBe(pnl.ordersRevenue);
  });
});

describe("buildMonthOptions", () => {
  it("lists months newest first with full-month bounds", () => {
    const options = buildMonthOptions(new Date("2026-09-15T12:00:00.000Z"), 3);

    expect(options.map((option) => option.key)).toEqual(["2026-09", "2026-08", "2026-07"]);
    expect(new Date(options[0].sinceMillis).toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(new Date(options[0].untilMillis).toISOString()).toBe("2026-09-30T23:59:59.999Z");
  });

  it("rolls back across a year boundary", () => {
    expect(buildMonthOptions(new Date("2026-01-10T00:00:00.000Z"), 2).map((o) => o.key)).toEqual([
      "2026-01",
      "2025-12"
    ]);
  });
});

describe("periodKeyFor", () => {
  it("zero-pads the month so keys sort correctly", () => {
    expect(periodKeyFor(new Date(2026, 0, 15))).toBe("2026-01");
    expect(periodKeyFor(new Date(2026, 11, 1))).toBe("2026-12");
  });
});
