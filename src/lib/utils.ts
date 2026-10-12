import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Public URL for an image stored in R2. */
export function mediaUrl(key: string): string {
  return `/media/${key}`;
}
