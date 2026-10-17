import "server-only";
import { getBindings } from "./env";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** A file field that actually holds an upload (browsers send an empty file when nothing is picked). */
export function isUpload(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

/** Stores an image in R2 and returns its key. Images are resized in the browser before upload. */
export async function saveImage(file: File, folder: string): Promise<string> {
  const extension = TYPES[file.type];
  if (!extension) throw new Error(`Unsupported image type: ${file.type}`);
  if (file.size > MAX_BYTES) throw new Error("Image is too large");

  const key = `${folder}/${crypto.randomUUID()}.${extension}`;
  await getBindings().MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/**
 * Applies an image field from a form: stores a new upload (deleting the old image),
 * removes the image when asked, or keeps it. Returns the key to save.
 */
export async function replaceImage(
  current: string | null,
  upload: FormDataEntryValue | null,
  remove: boolean,
  folder: string,
): Promise<string | null> {
  if (isUpload(upload)) {
    const key = await saveImage(upload, folder);
    await deleteImages([current]);
    return key;
  }
  if (remove) {
    await deleteImages([current]);
    return null;
  }
  return current;
}

export async function deleteImages(keys: (string | null | undefined)[]) {
  const present = keys.filter((key): key is string => Boolean(key));
  if (present.length > 0) await getBindings().MEDIA.delete(present);
}
