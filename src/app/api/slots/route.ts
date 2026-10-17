import type { NextRequest } from "next/server";
import { findBookingByToken, slotsForNewBooking, slotsForReschedule } from "@/lib/bookings";
import { getSettings } from "@/lib/config";
import { getDeploymentConfig } from "@/lib/env";
import { isDateString } from "@/lib/time";

/**
 * Free start times on a date.
 *   New booking:  ?date=2026-10-14&service=3&options=7,9&staff=2   (omit staff for "anyone")
 *   Reschedule:   ?date=2026-10-14&booking=<token>
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  if (!isDateString(date)) return Response.json({ error: "Invalid date" }, { status: 400 });

  const settings = await getSettings();
  const { timeZone } = getDeploymentConfig();
  const token = params.get("booking");

  let slots;
  if (token) {
    const booking = await findBookingByToken(token);
    slots = booking ? await slotsForReschedule(booking, date, settings, timeZone) : [];
  } else {
    const staff = Number(params.get("staff"));
    slots = await slotsForNewBooking(
      {
        date,
        serviceId: Number(params.get("service")),
        optionIds: (params.get("options") ?? "").split(",").filter(Boolean).map(Number),
        staffId: Number.isInteger(staff) && staff > 0 ? staff : null,
      },
      settings,
      timeZone,
    );
  }

  return Response.json({ slots }, { headers: { "cache-control": "no-store" } });
}
