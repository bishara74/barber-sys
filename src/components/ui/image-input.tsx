"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

/** Downscales and re-encodes a photo in the browser so uploads stay small on slow connections. */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  // Older Safari cannot encode WebP and silently returns PNG, so fall back to JPEG.
  let blob = await encode("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg");
  if (!blob) return file;

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `image.${extension}`, { type: blob.type });
}

type ImageInputProps = {
  name: string;
  label: string;
  /** URL of the image already saved, shown until a new one is picked. */
  currentUrl?: string;
  multiple?: boolean;
  /** Tailwind classes for the preview box shape, e.g. "aspect-square w-24 rounded-full". */
  previewClassName?: string;
};

export function ImageInput({ name, label, currentUrl, multiple, previewClassName }: ImageInputProps) {
  const id = useId();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Clear the previews when the surrounding form is reset after a successful upload.
  useEffect(() => {
    const form = uploadRef.current?.form;
    const clear = () => setPreviews([]);
    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, []);

  async function onPick(files: FileList | null) {
    if (!files?.length || !uploadRef.current) return;
    setBusy(true);
    try {
      const shrunk = await Promise.all([...files].map(shrink));
      const transfer = new DataTransfer();
      shrunk.forEach((file) => transfer.items.add(file));
      uploadRef.current.files = transfer.files;
      setPreviews((old) => {
        old.forEach((url) => URL.revokeObjectURL(url));
        return shrunk.map((file) => URL.createObjectURL(file));
      });
    } finally {
      setBusy(false);
    }
  }

  const shown = previews.length > 0 ? previews : currentUrl ? [currentUrl] : [];

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {shown.map((url) => (
          // Local blob previews cannot go through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt=""
            className={cn("aspect-square w-20 rounded-theme border border-border object-cover", previewClassName)}
          />
        ))}
        <label
          htmlFor={id}
          className={cn(
            "flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-theme border border-dashed border-border text-xs text-muted hover:bg-accent",
            busy && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="size-5" aria-hidden />
          {busy ? "…" : null}
        </label>
      </div>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => onPick(event.target.files)}
      />
      {/* The resized files are what gets submitted. */}
      <input ref={uploadRef} type="file" name={name} multiple={multiple} hidden />
    </div>
  );
}
