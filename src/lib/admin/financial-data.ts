import { cache } from "react";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import type {
  CapitalAsset,
  Expense,
  ExpenseCategory,
  ManualRevenueEntry,
  PayrollPayment,
  RecurringExpenseTemplate,
  Worker
} from "@/lib/commerce/types";

export type AdminFinancialSource = "live" | "sample";

export type AdminFinancialData = {
  source: AdminFinancialSource;
  sourceMessage?: string;
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  recurringExpenseTemplates: RecurringExpenseTemplate[];
  capitalAssets: CapitalAsset[];
  workers: Worker[];
  payrollPayments: PayrollPayment[];
  manualRevenueEntries: ManualRevenueEntry[];
};

/**
 * Cached per-request, same reasoning as getAdminOperationsData — several
 * accounting pages (Expenses, Assets, Payroll, Financial) all read this.
 * No sample-data fallback beyond an empty set — this is new, real business
 * data with nothing meaningful to demo.
 */
export const getAdminFinancialData = cache(async (): Promise<AdminFinancialData> => {
  const context = getCommerceServerContext();
  if (!context) {
    return emptyData("Firebase Admin is not configured yet.");
  }

  try {
    const [
      expenseCategories,
      expenses,
      recurringExpenseTemplates,
      capitalAssets,
      workers,
      payrollPayments,
      manualRevenueEntries
    ] = await Promise.all([
      context.repo.listExpenseCategories(),
      context.repo.listExpenses(),
      context.repo.listRecurringExpenseTemplates(),
      context.repo.listCapitalAssets(),
      context.repo.listWorkers(),
      context.repo.listPayrollPayments(),
      context.repo.listManualRevenueEntries()
    ]);

    return {
      source: "live",
      expenseCategories,
      expenses,
      recurringExpenseTemplates,
      capitalAssets,
      workers,
      payrollPayments,
      manualRevenueEntries
    };
  } catch {
    return emptyData("Firestore is not ready yet.");
  }
});

function emptyData(sourceMessage: string): AdminFinancialData {
  return {
    source: "sample",
    sourceMessage,
    expenseCategories: [],
    expenses: [],
    recurringExpenseTemplates: [],
    capitalAssets: [],
    workers: [],
    payrollPayments: [],
    manualRevenueEntries: []
  };
}
