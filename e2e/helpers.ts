import { randomInt, randomUUID } from "node:crypto";
import { expect, test as base, type BrowserContext, type Page } from "@playwright/test";
import { querySql, sqlString } from "../scripts/lib.mjs";

export const TIME_ZONE = "Asia/Jerusalem";
export type Customer = { name: string; phone: string };
export type Selection = { date: string; time: string; startsAt: number };
type SlotResponse = { slots: { start: number; staffIds: number[] }[] };

export const test = base.extend<{ customer: () => Customer }>({
  customer: [async ({ context }, provide) => {
    await english(context);
    const created: Customer[] = [];
    try {
      await provide(() => {
        const customer = { name: `E2E ${randomUUID()}`, phone: `059${randomInt(1_000_000, 10_000_000)}` };
        created.push(customer);
        return customer;
      });
    } finally {
      // Only rows owned by this test are removed; the demo and other tests are preserved.
      if (created.length) {
        const names = created.map(({ name }) => sqlString(name)).join(",");
        querySql(`DELETE FROM bookings WHERE customer_name IN (${names}); DELETE FROM customers WHERE name IN (${names}) AND NOT EXISTS (SELECT 1 FROM bookings WHERE customer_id = customers.id);`, { local: true });
      }
    }
  }, { auto: true }],
});
export { expect };

export async function english(context: BrowserContext) {
  await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://localhost:3000" }]);
}

export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("local-dev-only");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

export async function timeStep(page: Page) {
  await page.goto("/book");
  await page.getByRole("button", { name: /^Haircut\b/ }).click();
  await page.getByRole("radio", { name: "Short", exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Ali", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(dayChips(page).first()).toBeVisible();
}

export const dayChips = (page: Page) => page.getByRole("button", { name: /^(Today|Tomorrow|Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/ });
const timeButtons = (page: Page) => page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function plusDays(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00Z`));
}
function clock(start: number) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(start);
}

export function slotsPath(page: Page, date: string) {
  const token = new URL(page.url()).pathname.match(/^\/booking\/([^/]+)\/reschedule$/)?.[1];
  // The demo's Haircut / Short / Ali IDs, matching timeStep's visible selections.
  const params = token
    ? new URLSearchParams({ date, booking: token })
    : new URLSearchParams({ date, service: "1", options: "4", staff: "1" });
  return `/api/slots?${params}`;
}

async function chooseDay(page: Page, index: number, date: string) {
  const chip = dayChips(page).nth(index);
  let data: SlotResponse;
  if (await chip.getAttribute("aria-pressed") === "true") {
    await chip.click();
    // On a closed today (Friday), the picker may already show tomorrow. Clicking
    // that chip again does not trigger a fetch, so read its real local availability.
    await expect(page.locator('[aria-label="Loading times…"]')).toHaveCount(0);
    const response = await page.request.get(slotsPath(page, date));
    expect(response.ok()).toBe(true);
    data = await response.json() as SlotResponse;
  } else {
    const response = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === "/api/slots" && url.searchParams.get("date") === date && response.ok();
    });
    await chip.click();
    data = await (await response).json() as SlotResponse;
  }
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[aria-label="Loading times…"]')).toHaveCount(0);
  if (data.slots.length) await expect(timeButtons(page).first()).toBeVisible();
  else await expect(timeButtons(page)).toHaveCount(0);
  return data.slots;
}

/** Searches future chips in order and returns the actual selected date, never today. */
export async function futureSlot(page: Page, selection?: Selection, excludeTime?: string, targetDate?: string): Promise<Selection> {
  const first = today();
  const chips = dayChips(page);
  await expect(chips.first()).toBeVisible();
  const total = await chips.count();
  for (let index = 1; index < total; index++) {
    const date = plusDays(first, index);
    const requestedDate = selection?.date ?? targetDate;
    if (requestedDate && date !== requestedDate) continue;
    if (await chips.nth(index).isDisabled()) continue;
    const slots = await chooseDay(page, index, date);
    const candidate = slots.find((slot) => selection ? slot.start === selection.startsAt : clock(slot.start) !== excludeTime);
    if (!candidate) {
      if (selection) throw new Error(`Requested slot is no longer available: ${selection.date} ${selection.time}`);
      continue;
    }
    const chosen = { date, time: clock(candidate.start), startsAt: candidate.start };
    await page.getByRole("button", { name: chosen.time, exact: true }).click();
    await expect(chips.nth(index)).toHaveAttribute("aria-pressed", "true");
    return chosen;
  }
  throw new Error("No bookable future slot within the displayed booking horizon");
}

export async function details(page: Page, customer: Customer) {
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill(customer.name);
  await page.getByRole("textbox", { name: /Phone number/ }).fill(customer.phone);
  await page.getByLabel("Note for the shop", { exact: true }).fill("Created by browser tests");
}
export async function submit(page: Page) {
  await page.getByRole("button", { name: "Book now", exact: true }).click();
  await expect(page).toHaveURL(/\/booking\/[^/?]+/);
  return new URL(page.url()).pathname;
}
export async function book(page: Page, customer: Customer, selection?: Selection) {
  await timeStep(page);
  const chosen = await futureSlot(page, selection);
  await details(page, customer);
  const path = await submit(page);
  return { ...chosen, path };
}

export function storedBookings(names: string[]) {
  return querySql(`SELECT id, customer_name, customer_phone, starts_at, status FROM bookings WHERE customer_name IN (${names.map(sqlString).join(",")})`, { local: true }) as {
    id: number; customer_name: string; customer_phone: string; starts_at: number; status: string;
  }[];
}
