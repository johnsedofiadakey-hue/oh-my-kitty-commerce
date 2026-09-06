import { describe, expect, it } from "vitest";
import { buildPayrollAccrual, buildPnlReport, periodKeyFor } from "@/lib/admin/financial-reports";
import type { PayrollPayment, Worker } from "@/lib/commerce/types";

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

describe("periodKeyFor", () => {
  it("zero-pads the month so keys sort correctly", () => {
    expect(periodKeyFor(new Date(2026, 0, 15))).toBe("2026-01");
    expect(periodKeyFor(new Date(2026, 11, 1))).toBe("2026-12");
  });
});
