import "server-only";
import { headers } from "next/headers";
import { getDeploymentConfig } from "./env";

/**
 * Checks a Cloudflare Turnstile token. When no secret is configured (local development),
 * the check is skipped.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const { turnstileSecretKey } = getDeploymentConfig();
  if (!turnstileSecretKey) return true;
  if (!token) return false;

  const body = new FormData();
  body.append("secret", turnstileSecretKey);
  body.append("response", token);
  const ip = (await headers()).get("cf-connecting-ip");
  if (ip) body.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
