import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { TaxonomyRow } from "@/components/admin/taxonomy-row";
import {
  CreateExpenseCategoryForm,
  CreateExpenseForm,
  CreateRecurringExpenseForm,
  ExpenseRow,
  RecurringExpenseRow
} from "@/components/admin/expense-forms";
import { formatMoney } from "@/lib/commerce/format";
import {
  createExpenseAction,
  createExpenseCategoryAction,
  createRecurringExpenseTemplateAction,
  deleteExpenseAction,
  deleteRecurringExpenseTemplateAction,
  logRecurringExpenseAction,
  quickEditExpenseCategoryAction
} from "./actions";

export const dynamic = "force-dynamic";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateLabel(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminExpensesPage() {
  await requireAdminPermission("expenses.view");
  const data = await getAdminFinancialData();
  const disabled = data.source !== "live";
  const period = currentPeriod();

  const categoriesById = new Map(data.expenseCategories.map((category) => [category.id, category]));
  const recentExpenses = data.expenses.slice(0, 50);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Expenses</h1>
          <p className="app-subtitle">Raw materials, rent, utilities, and everything else that leaves the till.</p>
        </div>
        <AdminDrawer title="Log an expense" triggerLabel="Log expense">
          <CreateExpenseForm action={createExpenseAction} categories={data.expenseCategories} disabled={disabled} />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      {data.expenseCategories.length === 0 ? (
        <div className="admin-alert" role="status">
          Add a category below before logging your first expense.
        </div>
      ) : null}

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Categories</h2>
          <span>{data.expenseCategories.length} categories</span>
        </div>
        <div className="quick-edit-list">
          {data.expenseCategories.map((category) => (
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
          {data.expenseCategories.length === 0 ? <p className="admin-help">No categories yet.</p> : null}
        </div>
        <div className="admin-panel-section">
          <CreateExpenseCategoryForm action={createExpenseCategoryAction} disabled={disabled} />
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Recurring expenses</h2>
          <span>{data.recurringExpenseTemplates.length} set up</span>
        </div>
        <div className="stack-list">
          {data.recurringExpenseTemplates.map((template) => (
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
          {data.recurringExpenseTemplates.length === 0 ? (
            <p className="admin-help">Nothing recurring set up yet — rent, salaries, subscriptions.</p>
          ) : null}
        </div>
        {data.expenseCategories.length > 0 ? (
          <div className="admin-panel-section">
            <CreateRecurringExpenseForm
              action={createRecurringExpenseTemplateAction}
              categories={data.expenseCategories}
              disabled={disabled}
            />
          </div>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Recent expenses</h2>
          <span>{data.expenses.length} logged</span>
        </div>
        <div className="stack-list">
          {recentExpenses.map((expense) => (
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
          {recentExpenses.length === 0 ? <p className="admin-help">Nothing logged yet.</p> : null}
        </div>
      </section>
    </>
  );
}
