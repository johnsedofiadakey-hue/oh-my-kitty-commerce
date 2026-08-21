import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getClientStorage, refreshClientIdToken } from "@/lib/firebase/client";
import { compressImage } from "@/lib/admin/compress-image";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Validates, compresses, and uploads an admin-picked image file to Firebase
 * Storage. Shared by every image uploader in the admin (product, category,
 * general media) — the only thing that varies between them is the storage
 * path, so callers pass a function from the compressed file's extension to
 * their own path.
 */
export async function compressAndUploadImage(file: File, storagePathFor: (extension: string) => string) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image must be under 5MB.");
  }

  const storage = getClientStorage();
  if (!storage) {
    throw new Error("Firebase Storage isn't configured for this environment yet.");
  }

  await refreshClientIdToken();
  const compressed = await compressImage(file);
  const extension = compressed.name.split(".").pop() ?? "jpg";
  const storagePath = storagePathFor(extension);
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, compressed, { contentType: compressed.type });
  const url = await getDownloadURL(storageRef);

  return { storagePath, url };
}
