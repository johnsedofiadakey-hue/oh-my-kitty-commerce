"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { compressAndUploadImage } from "@/lib/admin/upload-image";
import type { AdminActionState } from "@/lib/admin/product-form";

type GeneralMediaUploaderProps = {
  disabled: boolean;
  onAttach: (input: { storagePath: string; url: string; alt: string }) => Promise<AdminActionState>;
};

/** Uploads an image not tied to any product or category — for one-off assets like a banner or a promo graphic. */
export function GeneralMediaUploader({ disabled, onAttach }: GeneralMediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ status: AdminActionState["status"]; text: string } | null>(
    null
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage({ status: "error", text: "Choose an image file." });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const { storagePath, url } = await compressAndUploadImage(
        file,
        (extension) => `public/media/${Date.now()}.${extension}`
      );

      const result = await onAttach({ storagePath, url, alt: alt || file.name });
      setMessage({ status: result.status, text: result.message });
      if (result.status === "success") {
        setFile(null);
        setAlt("");
      }
    } catch (error) {
      setMessage({ status: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <fieldset disabled={disabled || uploading}>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Description</span>
            <input
              onChange={(event) => setAlt(event.target.value)}
              placeholder="e.g. About us banner"
              value={alt}
            />
          </label>
          <label className="admin-field">
            <span>Image file</span>
            <input
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
        </div>
        <button className="admin-action" type="submit">
          {uploading ? "Uploading" : "Upload"}
        </button>
      </fieldset>
      {message ? (
        <p className={message.status === "error" ? "form-error" : "admin-form-status success"}>
          {message.text}
        </p>
      ) : null}
      {disabled ? <p className="admin-help">Enable Firestore and sign in to upload media.</p> : null}
    </form>
  );
}
