"use client";

import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Swipeable product photos with dots that follow the scroll position. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-accent">
        <ShoppingBag className="size-12 text-muted/40" aria-hidden />
      </div>
    );
  }

  const show = (index: number) => {
    const element = strip.current;
    if (!element) return;
    // Scroll offsets are negative in right-to-left layouts, so use the slide's own position.
    (element.children[index] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div className="relative">
      <div
        ref={strip}
        onScroll={(event) => {
          const element = event.currentTarget;
          setCurrent(Math.round(Math.abs(element.scrollLeft) / element.clientWidth));
        }}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto bg-accent"
      >
        {images.map((url, index) => (
          <div key={url} className="relative aspect-square w-full shrink-0 snap-center">
            <Image src={url} alt={alt} fill priority={index === 0} className="object-cover" sizes="(max-width: 576px) 100vw, 576px" />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`${index + 1} / ${images.length}`}
              aria-current={index === current}
              onClick={() => show(index)}
              className={cn(
                "h-2 rounded-full bg-white/60 shadow-sm backdrop-blur transition-all",
                index === current ? "w-5 bg-white" : "w-2",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
