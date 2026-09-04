"use client";

import { useActionState, useState } from "react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { initialAdminActionState, type AdminActionState } from "@/lib/admin/product-form";

type WorkerFormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

function WorkerFields({
  name,
  role,
  status,
  monthlySalary,
  startDate,
  phone,
  ghanaCardNumber,
  bankName,
  bankAccountNumber,
  momoNumber,
  momoNetwork,
  emergencyContactName,
  emergencyContactPhone,
  nextOfKinName,
  nextOfKinRelationship,
  nextOfKinPhone,
  parentGuardianName,
  siblingsInfo,
  notes
}: {
  name?: string;
  role?: string;
  status?: "ACTIVE" | "INACTIVE";
  monthlySalary?: string;
  startDate?: string;
  phone?: string;
  ghanaCardNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  momoNumber?: string;
  momoNetwork?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  parentGuardianName?: string;
  siblingsInfo?: string;
  notes?: string;
}) {
  return (
    <>
      <span className="admin-field-group-label">Basic info</span>
      <label className="admin-field">
        <span>Full name</span>
        <input defaultValue={name} name="name" required />
      </label>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Role / title</span>
          <input defaultValue={role} name="role" placeholder="e.g. Sales Assistant" />
        </label>
        <label className="admin-field">
          <span>Status</span>
          <select defaultValue={status ?? "ACTIVE"} name="status">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </div>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Monthly salary GHS</span>
          <input defaultValue={monthlySalary} inputMode="decimal" name="monthlySalary" placeholder="e.g. 1200.00" required />
        </label>
        <label className="admin-field">
          <span>Start date (optional)</span>
          <input defaultValue={startDate} name="startDate" type="date" />
        </label>
      </div>
      <label className="admin-field">
        <span>Phone</span>
        <input defaultValue={phone} name="phone" placeholder="024 000 0000" />
      </label>

      <span className="admin-field-group-label">ID &amp; banking</span>
      <label className="admin-field">
        <span>Ghana Card number</span>
        <input defaultValue={ghanaCardNumber} name="ghanaCardNumber" placeholder="GHA-XXXXXXXXX-X" />
      </label>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Bank name</span>
          <input defaultValue={bankName} name="bankName" />
        </label>
        <label className="admin-field">
          <span>Bank account number</span>
          <input defaultValue={bankAccountNumber} name="bankAccountNumber" />
        </label>
      </div>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>MoMo number</span>
          <input defaultValue={momoNumber} name="momoNumber" />
        </label>
        <label className="admin-field">
          <span>MoMo network</span>
          <input defaultValue={momoNetwork} name="momoNetwork" placeholder="MTN / Telecel / AirtelTigo" />
        </label>
      </div>

      <span className="admin-field-group-label">Emergency contact &amp; family</span>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Emergency contact name</span>
          <input defaultValue={emergencyContactName} name="emergencyContactName" />
        </label>
        <label className="admin-field">
          <span>Emergency contact phone</span>
          <input defaultValue={emergencyContactPhone} name="emergencyContactPhone" />
        </label>
      </div>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Next of kin name</span>
          <input defaultValue={nextOfKinName} name="nextOfKinName" />
        </label>
        <label className="admin-field">
          <span>Relationship</span>
          <input defaultValue={nextOfKinRelationship} name="nextOfKinRelationship" placeholder="e.g. Sister" />
        </label>
      </div>
      <label className="admin-field">
        <span>Next of kin phone</span>
        <input defaultValue={nextOfKinPhone} name="nextOfKinPhone" />
      </label>
      <label className="admin-field">
        <span>Parent / guardian (optional)</span>
        <input defaultValue={parentGuardianName} name="parentGuardianName" />
      </label>
      <label className="admin-field">
        <span>Siblings (optional)</span>
        <input defaultValue={siblingsInfo} name="siblingsInfo" placeholder="Free text, e.g. names/contacts" />
      </label>
      <label className="admin-field">
        <span>Notes (optional)</span>
        <input defaultValue={notes} name="notes" />
      </label>
    </>
  );
}

export function CreateWorkerForm({ action, disabled }: { action: WorkerFormAction; disabled: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <WorkerFields />
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Adding..." : "Add worker"}
        </button>
      </fieldset>
    </form>
  );
}

export function WorkerRow({
  workerId,
  name,
  role,
  status,
  salaryLabel,
  monthlySalaryValue,
  startDateValue,
  phone,
  ghanaCardNumber,
  bankName,
  bankAccountNumber,
  momoNumber,
  momoNetwork,
  emergencyContactName,
  emergencyContactPhone,
  nextOfKinName,
  nextOfKinRelationship,
  nextOfKinPhone,
  parentGuardianName,
  siblingsInfo,
  notes,
  disabled,
  updateAction,
  deleteAction
}: {
  workerId: string;
  name: string;
  role?: string;
  status: "ACTIVE" | "INACTIVE";
  salaryLabel: string;
  monthlySalaryValue: string;
  startDateValue?: string;
  phone?: string;
  ghanaCardNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  momoNumber?: string;
  momoNetwork?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  parentGuardianName?: string;
  siblingsInfo?: string;
  notes?: string;
  disabled: boolean;
  updateAction: WorkerFormAction;
  deleteAction: (workerId: string) => Promise<AdminActionState>;
}) {
  const [state, formAction, pending] = useActionState(updateAction, initialAdminActionState);
  const [busy, setBusy] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Remove ${name} from the worker directory? Past payroll records stay.`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(workerId);
    setDeleteMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <AdminDrawer
      title={name}
      trigger={
        <div className="inventory-row">
          <div className="inventory-row-main">
            <strong>{name}</strong>
            <span>{role || "No role set"}</span>
          </div>
          <span className={status === "ACTIVE" ? "order-status-pill good" : "order-status-pill neutral"}>
            {status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
          <strong className="inventory-row-stock">{salaryLabel}/mo</strong>
        </div>
      }
    >
      <div className="order-detail">
        <form action={formAction} className="admin-form">
          <input name="id" type="hidden" value={workerId} />
          <fieldset disabled={disabled || pending}>
            <WorkerFields
              bankAccountNumber={bankAccountNumber}
              bankName={bankName}
              emergencyContactName={emergencyContactName}
              emergencyContactPhone={emergencyContactPhone}
              ghanaCardNumber={ghanaCardNumber}
              momoNetwork={momoNetwork}
              momoNumber={momoNumber}
              monthlySalary={monthlySalaryValue}
              name={name}
              nextOfKinName={nextOfKinName}
              nextOfKinPhone={nextOfKinPhone}
              nextOfKinRelationship={nextOfKinRelationship}
              notes={notes}
              parentGuardianName={parentGuardianName}
              phone={phone}
              role={role}
              siblingsInfo={siblingsInfo}
              startDate={startDateValue}
              status={status}
            />
            {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
            <button className="admin-action" type="submit">
              {pending ? "Saving..." : "Save changes"}
            </button>
          </fieldset>
        </form>
        <section className="order-detail-section">
          <h3>Danger zone</h3>
          <button className="admin-action danger small" disabled={disabled || busy} onClick={() => void handleDelete()} type="button">
            {busy ? "Removing..." : "Remove worker"}
          </button>
          {deleteMessage ? <p className="form-error">{deleteMessage}</p> : null}
        </section>
      </div>
    </AdminDrawer>
  );
}

export function PayWorkerForm({
  action,
  workerId,
  workerName,
  defaultGrossValue,
  period,
  disabled,
  alreadyPaid
}: {
  action: WorkerFormAction;
  workerId: string;
  workerName: string;
  defaultGrossValue: string;
  period: string;
  disabled: boolean;
  alreadyPaid: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="admin-form pay-worker-form">
      <input name="workerId" type="hidden" value={workerId} />
      <input name="period" type="hidden" value={period} />
      <fieldset disabled={disabled || pending}>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>{workerName} — gross GHS</span>
            <input defaultValue={defaultGrossValue} inputMode="decimal" name="grossAmount" required />
          </label>
          <label className="admin-field">
            <span>Paid date</span>
            <input defaultValue={today} name="paidDate" required type="date" />
          </label>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Deduction label (optional)</span>
            <input name="deductionLabel" placeholder="e.g. Advance repayment" />
          </label>
          <label className="admin-field">
            <span>Deduction amount GHS</span>
            <input inputMode="decimal" name="deductionAmount" placeholder="0.00" />
          </label>
        </div>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action ghost small" type="submit">
          {pending ? "Paying..." : alreadyPaid ? "Correct payment" : "Pay for this period"}
        </button>
      </fieldset>
    </form>
  );
}

export function PayrollHistoryRow({
  paymentId,
  workerName,
  period,
  netLabel,
  paidDateLabel,
  disabled,
  deleteAction
}: {
  paymentId: string;
  workerName: string;
  period: string;
  netLabel: string;
  paidDateLabel: string;
  disabled: boolean;
  deleteAction: (paymentId: string) => Promise<AdminActionState>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Delete the ${period} payment record for ${workerName}?`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(paymentId);
    setMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <div className="stack-row">
      <strong>{workerName}</strong>
      <span>
        {period} &middot; paid {paidDateLabel}
      </span>
      <div className="stack-row-actions">
        <strong>{netLabel}</strong>
        <button className="text-button" disabled={disabled || busy} onClick={() => void handleDelete()} type="button">
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
      {message ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
