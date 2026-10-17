import "server-only";
import { headers } from "next/headers";
import { cache } from "react";

/** "Now" for the current request, the same for every component that renders it. */
export const requestTime = cache((): number => Date.now());

/** The site origin of the current request, e.g. "https://shop.example.com". */
export async function requestOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
