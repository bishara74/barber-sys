/**
 * Normalizes a phone number to digits-only international format (e.g. "970591234567"),
 * which is what wa.me links expect. Local numbers get the shop's country code.
 */
export function normalizePhone(input: string, countryCode: string): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    // Already international.
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = countryCode + digits.slice(1);
  } else if (!digits.startsWith(countryCode) && digits.length <= 9) {
    digits = countryCode + digits;
  }

  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function displayPhone(digits: string): string {
  return digits ? `+${digits}` : "";
}

/** A wa.me link, with a pre-filled message when there is one. */
export function whatsappLink(phoneDigits: string, text: string): string {
  const chat = `https://wa.me/${phoneDigits.replace(/\D/g, "")}`;
  return text ? `${chat}?text=${encodeURIComponent(text)}` : chat;
}
