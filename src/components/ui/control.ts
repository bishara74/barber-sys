/**
 * Shared look of text inputs and selects. In its own module (not field.tsx, a client module)
 * so server components can use it too.
 */
export const controlClass =
  "w-full rounded-theme border border-border bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition " +
  "placeholder:text-muted/70 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-ring " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20";
