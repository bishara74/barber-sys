import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { SocialPlatform } from "@/db/schema";
import { BRAND_ICON_PATHS } from "./brand-icons";

const generic = { phone: Phone, email: Mail, maps: MapPin, website: Globe };

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  snapchat: "Snapchat",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  x: "X",
  telegram: "Telegram",
  threads: "Threads",
  phone: "Phone",
  email: "Email",
  maps: "Maps",
  website: "Website",
};

export function SocialIcon({ platform, className = "size-5" }: { platform: SocialPlatform; className?: string }) {
  if (platform in generic) {
    const Icon = generic[platform as keyof typeof generic];
    return <Icon className={className} aria-hidden />;
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={BRAND_ICON_PATHS[platform as keyof typeof BRAND_ICON_PATHS]} />
    </svg>
  );
}

/** Turns what the owner typed into a working link (phone numbers, emails, bare handles). */
export function socialHref(platform: SocialPlatform, value: string): string {
  const trimmed = value.trim();
  if (platform === "phone") return `tel:${trimmed.replace(/[^\d+]/g, "")}`;
  if (platform === "email") return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
  if (platform === "whatsapp" && /^\+?[\d\s-]+$/.test(trimmed)) return `https://wa.me/${trimmed.replace(/\D/g, "")}`;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
