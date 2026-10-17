import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";

type ShopMarkProps = { name: string; logoKey?: string; className?: string; sizes?: string; priority?: boolean };

/** The shop's logo, or its first letter on the main color when there is no logo. */
export function ShopMark({ name, logoKey, className, sizes = "64px", priority }: ShopMarkProps) {
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary to-primary/75 font-bold text-primary-foreground",
        className,
      )}
    >
      {logoKey ? (
        <Image src={mediaUrl(logoKey)} alt={name} fill priority={priority} className="bg-card object-cover" sizes={sizes} />
      ) : (
        <span aria-hidden>{[...name.trim()][0]?.toUpperCase() ?? "•"}</span>
      )}
    </span>
  );
}
