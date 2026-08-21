"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getClientStorage, refreshClientIdToken } from "@/lib/firebase/client";
import type { AdminActionState } from "@/lib/admin/product-form";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type MediaUploaderProps = {
  productId: string;
  variantId: string;
  alt: string;
  currentImageUrl?: string;
  disabled: boolean;
  onAttach: (input: {
    productId: string;
    variantId: string;
    storagePath: string;
    url: string;
    alt: string;
  }) => Promise<AdminActionState>;
};

export function MediaUploader({
  productId,
  variantId,
  alt,
  currentImageUrl,
  disabled,
  onAttach
}: MediaUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ status: AdminActionState["status"]; text: string } | null>(
    null
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ status: "error", text: "Choose an image file." });
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setMessage({ status: "error", text: "Image must be under 5MB." });
      return;
    }

    const storage = getClientStorage();
    if (!storage) {
      setMessage({ status: "error", text: "Firebase Storage isn't configured for this environment yet." });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      await refreshClientIdToken();
      const extension = file.name.split(".").pop() ?? "jpg";
      const storagePath = `products/${productId}/${variantId}-${Date.now()}.${extension}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);

      const result = await onAttach({ productId, variantId, storagePath, url, alt });
      if (result.status === "success") {
        setPreviewUrl(url);
      }
      setMessage({ status: result.status, text: result.message });
    } catch (error) {
      setMessage({ status: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="media-uploader">
      <div className="media-uploader-preview">
        {previewUrl ? (
          <Image alt="" fill sizes="72px" src={previewUrl} />
        ) : (
          <span className="media-uploader-empty" aria-hidden="true" />
        )}
      </div>
      <div className="media-uploader-controls">
        <label className="admin-action ghost small media-uploader-button">
          {uploading ? "Uploading" : previewUrl ? "Replace image" : "Upload image"}
          <input
            accept="image/*"
            disabled={disabled || uploading}
            hidden
            onChange={handleFileChange}
            type="file"
          />
        </label>
        {message ? (
          <p className={message.status === "error" ? "form-error" : "admin-form-status success"}>
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
