"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HTMLAttributes, MouseEvent, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Tables for dashboard lists. Hide less important columns on phones with "hidden sm:table-cell"
 * on both the header and the cells. A row with an href opens it when tapped anywhere.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-theme border border-border bg-card shadow-soft", className)}>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface text-xs text-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeader({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn("px-4 py-3 text-start font-medium whitespace-nowrap", className)} {...props} />;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Opens this page when the row is tapped. Put a RowLink in the row for keyboards and screen readers. */
  href?: string;
  muted?: boolean;
};

export function TableRow({ className, muted, href, ...props }: TableRowProps) {
  const router = useRouter();

  function open(event: MouseEvent<HTMLTableRowElement>) {
    // Buttons, links and fields in the row do their own thing; selecting text shouldn't navigate.
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, label")) return;
    if (window.getSelection()?.toString()) return;
    router.push(href!);
  }

  return (
    <tr
      onClick={href ? open : undefined}
      className={cn("transition-colors", href && "cursor-pointer hover:bg-primary-tint", muted && "text-muted", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}

/** The row's main link, for keyboards, screen readers and opening in a new tab. */
export function RowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("font-medium hover:text-primary focus-visible:text-primary", className)}>
      {children}
    </Link>
  );
}
