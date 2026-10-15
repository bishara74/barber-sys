import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** "← Customers" above a detail page's title. The arrow flips in Arabic. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-primary"
    >
      <ArrowLeft
        className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5"
        aria-hidden
      />
      {label}
    </Link>
  );
}
