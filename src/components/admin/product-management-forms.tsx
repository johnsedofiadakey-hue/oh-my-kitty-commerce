"use client";

import { useActionState, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";
import { compressAndUploadImage } from "@/lib/admin/upload-image";

type ProductOption = {
  id: string;
  title: string;
};

type AttachProductImageAction = (input: {
  productId: string;
  variantId: string;
  storagePath: string;
  url: string;
  alt: string;
}) => Promise<AdminActionState>;

type ProductManagementFormsProps = {
  createProductAction: AdminFormAction;
  createVariantAction: AdminFormAction;
  attachProductImageAction: AttachProductImageAction;
  products: ProductOption[];
  source: "live" | "sample";
};

export function ProductManagementForms({
  createProductAction,
  createVariantAction,
  attachProductImageAction,
  products,
  source
}: ProductManagementFormsProps) {
  return (
    <section className="admin-grid two">
      <CreateProductForm
        action={createProductAction}
        attachProductImageAction={attachProductImageAction}
        disabled={source !== "live"}
      />
      <CreateVariantForm
        action={createVariantAction}
        disabled={source !== "live"}
        products={products}
      />
    </section>
  );
}

export function CreateProductForm({
  action,
  attachProductImageAction,
  disabled
}: {
  action: AdminFormAction;
  attachProductImageAction: AttachProductImageAction;
  disabled: boolean;
}) {
  const [state, setState] = useState<AdminActionState>(initialAdminActionState);
  const [pending, setPending] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<{ status: AdminActionState["status"]; text: string } | null>(
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) {
      return;
    }

    setPhotoStatus(null);
    setPhoto(file);
    setPhotoPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setPending(true);
    setPhotoStatus(null);
    const result = await action(initialAdminActionState, formData);
    setState(result);
    setPending(false);

    if (result.status !== "success") {
      return;
    }

    if (result.productId && result.variantId && photo) {
      const productId = result.productId;
      const variantId = result.variantId;
      setPhotoUploading(true);
      try {
        const { storagePath, url } = await compressAndUploadImage(
          photo,
          (extension) => `products/${productId}/${variantId}-${Date.now()}.${extension}`
        );
        const attachResult = await attachProductImageAction({
          productId,
          variantId,
          storagePath,
          url,
          alt: ""
        });
        setPhotoStatus({ status: attachResult.status, text: attachResult.message });
      } catch (error) {
        setPhotoStatus({
          status: "error",
          text: error instanceof Error ? error.message : "Photo upload failed."
        });
      } finally {
        setPhotoUploading(false);
      }
    }

    setPhoto(null);
    setPhotoPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    formRef.current?.reset();
  }

  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>Create product</h2>
        <span>Product + first variant</span>
      </div>
      <form className="admin-form" onSubmit={handleSubmit} ref={formRef}>
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <div className="admin-field">
            <span>Product photo</span>
            <div className="media-uploader">
              <div className="media-uploader-preview">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob: preview before upload, next/image can't fetch it
                  <img alt="" src={photoPreview} />
                ) : (
                  <span aria-hidden="true" className="media-uploader-empty" />
                )}
              </div>
              <div className="media-uploader-controls">
                <label className="admin-action ghost small media-uploader-button">
                  {photoUploading ? "Uploading" : photo ? "Replace photo" : "Upload photo"}
                  <input
                    accept="image/*"
                    disabled={photoUploading}
                    hidden
                    onChange={handlePhotoChange}
                    type="file"
                  />
                </label>
                {photoStatus ? (
                  <p className={photoStatus.status === "error" ? "form-error" : "admin-form-status success"}>
                    {photoStatus.text}
                  </p>
                ) : (
                  <p className="admin-help">Attached automatically once the product is created.</p>
                )}
              </div>
            </div>
          </div>
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
          <label className="admin-field checkbox">
            <input name="bestSeller" type="checkbox" />
            <span>Best seller (shows in Live Products on the home page)</span>
          </label>
          <button className="admin-action" type="submit">
            {pending ? "Creating" : "Create product"}
          </button>
        </fieldset>
        {disabled ? <p className="admin-help">Enable Firestore and sign in to save.</p> : null}
      </form>
    </section>
  );
}

export function CreateVariantForm({
  action,
  disabled,
  products
}: {
  action: AdminFormAction;
  disabled: boolean;
  products: ProductOption[];
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
