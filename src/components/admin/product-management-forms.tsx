"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";
import type { Product } from "@/lib/commerce/types";

type ProductManagementFormsProps = {
  createProductAction: AdminFormAction;
  createVariantAction: AdminFormAction;
  products: Product[];
  source: "live" | "sample";
};

export function ProductManagementForms({
  createProductAction,
  createVariantAction,
  products,
  source
}: ProductManagementFormsProps) {
  return (
    <section className="admin-grid two">
      <CreateProductForm action={createProductAction} disabled={source !== "live"} />
      <CreateVariantForm
        action={createVariantAction}
        disabled={source !== "live"}
        products={products}
      />
    </section>
  );
}

function CreateProductForm({
  action,
  disabled
}: {
  action: AdminFormAction;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>Create product</h2>
        <span>Product + first variant</span>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <label className="admin-field">
            <span>Product name</span>
            <input name="title" placeholder="OMK Daily Care" required />
          </label>
          <label className="admin-field">
            <span>URL slug</span>
            <input name="slug" placeholder="omk-daily-care" />
          </label>
          <label className="admin-field">
            <span>Short copy</span>
            <input name="shortCopy" placeholder="Soft daily care." />
          </label>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Status</span>
              <select defaultValue="DRAFT" name="status">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Variant</span>
              <input defaultValue="Default" name="variantTitle" required />
            </label>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>SKU</span>
              <input name="sku" placeholder="OMK-CARE-001" required />
            </label>
            <label className="admin-field">
              <span>Price GHS</span>
              <input inputMode="decimal" min="0" name="price" placeholder="95.00" required />
            </label>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Opening stock</span>
              <input defaultValue="0" inputMode="numeric" min="0" name="stockOnHand" required />
            </label>
            <label className="admin-field">
              <span>Low stock</span>
              <input
                defaultValue="5"
                inputMode="numeric"
                min="0"
                name="lowStockThreshold"
                required
              />
            </label>
          </div>
          <button className="admin-action" type="submit">
            {pending ? "Creating" : "Create product"}
          </button>
        </fieldset>
        {disabled ? <p className="admin-help">Enable Firestore and sign in to save.</p> : null}
      </form>
    </section>
  );
}

function CreateVariantForm({
  action,
  disabled,
  products
}: {
  action: AdminFormAction;
  disabled: boolean;
  products: Product[];
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>Add variant</h2>
        <span>Existing product</span>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending || products.length === 0}>
          <label className="admin-field">
            <span>Product</span>
            <select name="productId" required>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Variant</span>
              <input name="variantTitle" placeholder="30 capsules" required />
            </label>
            <label className="admin-field">
              <span>SKU</span>
              <input name="sku" placeholder="OMK-CARE-030" required />
            </label>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Price GHS</span>
              <input inputMode="decimal" min="0" name="price" placeholder="120.00" required />
            </label>
            <label className="admin-field">
              <span>Opening stock</span>
              <input defaultValue="0" inputMode="numeric" min="0" name="stockOnHand" required />
            </label>
          </div>
          <label className="admin-field">
            <span>Low stock</span>
            <input defaultValue="5" inputMode="numeric" min="0" name="lowStockThreshold" required />
          </label>
          <button className="admin-action" type="submit">
            {pending ? "Adding" : "Add variant"}
          </button>
        </fieldset>
        {disabled ? <p className="admin-help">Live catalogue is required before saving variants.</p> : null}
      </form>
    </section>
  );
}

function FormStatus({ state }: { state: AdminActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className={`admin-form-status ${state.status}`}>{state.message}</p>;
}
