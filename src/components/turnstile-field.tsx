"use client";

import { useState } from "react";
import { Turnstile } from "./turnstile";

/** Turnstile inside a regular form: the token is submitted as the "turnstileToken" field. */
export function TurnstileField({ siteKey }: { siteKey: string }) {
  const [token, setToken] = useState("");
  if (!siteKey) return null;
  return (
    <>
      <Turnstile siteKey={siteKey} onToken={(value) => setToken(value ?? "")} />
      <input type="hidden" name="turnstileToken" value={token} />
    </>
  );
}
