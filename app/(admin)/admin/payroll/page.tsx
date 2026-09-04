import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreateWorkerForm, PayWorkerForm, PayrollHistoryRow, WorkerRow } from "@/components/admin/worker-forms";
import { formatMoney } from "@/lib/commerce/format";
import {
  createWorkerAction,
  deletePayrollPaymentAction,
  deleteWorkerAction,
  payWorkerAction,
  updateWorkerAction
} from "./actions";

export const dynamic = "force-dynamic";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toDateInputValue(value: Date | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : undefined;
}

function formatDateLabel(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPayrollPage() {
  // payroll.view and payroll.manage are both Owner-only (see permissions.ts)
  // — nothing currently holds one without the other, so there's no separate
  // read-only payroll role to account for here, unlike other admin pages.
  await requireAdminPermission("payroll.view");
  const data = await getAdminFinancialData();
  const disabled = data.source !== "live";
  const period = currentPeriod();

  const activeWorkers = data.workers.filter((worker) => worker.status === "ACTIVE");
  const paymentsThisPeriod = new Map(
    data.payrollPayments.filter((payment) => payment.period === period).map((payment) => [payment.workerId, payment])
  );
  const workersById = new Map(data.workers.map((worker) => [worker.id, worker]));
  const recentPayments = data.payrollPayments.slice(0, 50);

  const totalMonthlyPayroll = activeWorkers.reduce((total, worker) => total + worker.monthlySalary, 0);
  const paidThisPeriod = data.payrollPayments
    .filter((payment) => payment.period === period)
    .reduce((total, payment) => total + payment.grossAmount, 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Payroll</h1>
          <p className="app-subtitle">
            Worker profiles and monthly pay. Owner-only — this carries national ID and bank details.
          </p>
        </div>
        <AdminDrawer title="Add a worker" triggerLabel="Add worker">
          <CreateWorkerForm action={createWorkerAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}

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
          <span>{data.workers.length} total</span>
        </div>
        <div className="order-list">
          {data.workers.map((worker) => (
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
              startDateValue={toDateInputValue(worker.startDate)}
              status={worker.status}
              updateAction={updateWorkerAction}
              workerId={worker.id}
            />
          ))}
          {data.workers.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Payment history</h2>
          <span>{data.payrollPayments.length} payments</span>
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
  );
}
