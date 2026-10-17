"use client";

import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn, stagger } from "@/lib/utils";
import type { ActionState } from "@/lib/forms";
import { useFormResult } from "./action-form";
import { Spinner } from "./button";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

type ShrinkOptions = { maxSide: number; square: boolean; format: "auto" | "png" };

/** Downscales and re-encodes a photo in the browser so uploads stay small on slow connections. */
async function shrink(file: File, { maxSide, square, format }: ShrinkOptions): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  // Square images (icons) keep the middle of the photo.
  const side = Math.min(bitmap.width, bitmap.height);
  const source = square
    ? { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, width: side, height: side }
    : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext("2d");
  if (context) {
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  let blob: Blob | null;
  if (format === "png") {
    // Icons stay PNG: every browser shows PNG favicons, and transparency is kept.
    blob = await encode("image/png");
  } else {
    // Older Safari cannot encode WebP and silently returns PNG, so fall back to JPEG.
    blob = await encode("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg");
  }
  if (!blob) return file;

  const extension = { "image/webp": "webp", "image/png": "png" }[blob.type] ?? "jpg";
  return new File([blob], `image.${extension}`, { type: blob.type });
}

type ImageInputProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  /** URL of the image already saved, shown until a new one is picked. */
  currentUrl?: string;
  multiple?: boolean;
  /** Tailwind classes for the preview box shape, e.g. "aspect-square w-24 rounded-full". */
  previewClassName?: string;
  /** Longest side after resizing, in pixels. */
  maxSide?: number;
  /** Crop to a centered square (for icons). */
  square?: boolean;
  /** "png" for icons; "auto" picks WebP, or JPEG where WebP isn't supported. */
  format?: "auto" | "png";
  /** Called with the picked photo's preview URL, e.g. to show it somewhere else on the page. */
  onPreview?: (url: string) => void;
};

export function ImageInput({
  name,
  label,
  hint,
  currentUrl,
  multiple,
  previewClassName,
  maxSide = MAX_SIDE,
  square = false,
  format = "auto",
  onPreview,
}: ImageInputProps) {
  const t = useTranslations("common");
  const id = useId();
  const uploadRef = useRef<HTMLInputElement>(null);
  const result = useFormResult();
  // Picked photos are previewed until the form saves them; after that the saved photo shows.
  const [picked, setPicked] = useState<{ urls: string[]; result: ActionState } | null>(null);
  const previews = picked && (picked.result === result || result.status !== "success") ? picked.urls : [];
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Saved photos are not sent again with the next save.
  useEffect(() => {
    if (result.status === "success" && uploadRef.current) uploadRef.current.value = "";
  }, [result]);

  // Clear the previews when the surrounding form is reset after a successful upload.
  useEffect(() => {
    const form = uploadRef.current?.form;
    const clear = () => setPicked(null);
    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, []);

  async function onPick(files: FileList | null) {
    const images = [...(files ?? [])].filter((file) => file.type.startsWith("image/"));
    if (!images.length || !uploadRef.current) return;
    setBusy(true);
    try {
      const shrunk = await Promise.all(
        (multiple ? images : images.slice(0, 1)).map((file) => shrink(file, { maxSide, square, format })),
      );
      const transfer = new DataTransfer();
      shrunk.forEach((file) => transfer.items.add(file));
      uploadRef.current.files = transfer.files;
      const urls = shrunk.map((file) => URL.createObjectURL(file));
      picked?.urls.forEach((url) => URL.revokeObjectURL(url));
      setPicked({ urls, result });
      if (urls[0]) onPreview?.(urls[0]);
    } finally {
      setBusy(false);
    }
  }

  const shown = previews.length > 0 ? previews : currentUrl ? [currentUrl] : [];

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {shown.map((url, index) => (
          // Local blob previews cannot go through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt=""
            style={stagger(index)}
            className={cn(
              "aspect-square w-20 animate-scale-in rounded-theme border border-border object-cover shadow-soft",
              previewClassName,
            )}
          />
        ))}
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            onPick(event.dataTransfer.files);
          }}
          className={cn(
            "flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-theme border-2 border-dashed border-border bg-surface/60 text-[11px] font-medium text-muted transition hover:border-primary/50 hover:bg-primary-tint hover:text-primary",
            dragging && "border-primary bg-primary-tint text-primary",
            busy && "pointer-events-none opacity-70",
          )}
        >
          {busy ? <Spinner className="size-5" /> : <ImagePlus className="size-5" aria-hidden />}
          {t("upload")}
        </label>
      </div>
      {hint ? <p className="text-xs leading-relaxed text-muted">{hint}</p> : null}
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
