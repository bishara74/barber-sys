"use client";

import { useEffect, useRef } from "react";

/** Centers today's column when the calendar is wider than the screen. */
export function ScrollToToday() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scroller = marker.current?.closest<HTMLElement>("[data-scroller]");
    const today = scroller?.querySelector<HTMLElement>("[data-today]");
    if (!scroller || !today) return;
    // Measured on screen, so it works the same in right-to-left layouts.
    const column = today.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    scroller.scrollBy({ left: column.left + column.width / 2 - (view.left + view.width / 2) });
  }, []);

  return <span ref={marker} hidden />;
}
