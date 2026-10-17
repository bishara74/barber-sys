import { test, expect, book, dateLabel, dayChips, details, english, futureSlot, login, plusDays, storedBookings, slotsPath, submit, timeStep, today } from "./helpers";

const pending = "Waiting for the shop to confirm";
const confirmed = "Your booking is confirmed";

test("approval booking includes WhatsApp and calendar links", async ({ page, customer }) => {
  const booking = await book(page, customer());
  await expect(page.getByText(pending, { exact: false })).toBeVisible();
  const whatsapp = page.getByRole("link", { name: "Send to the shop on WhatsApp", exact: true });
  const destination = new URL((await whatsapp.getAttribute("href"))!);
  expect(destination.hostname).toBe("wa.me");
  expect(destination.pathname).toBe("/970591234567");
  expect(destination.searchParams.get("text")?.trim()).toBeTruthy();
  const calendar = page.getByRole("link", { name: "Add to calendar", exact: true });
  await expect(calendar).toHaveAttribute("href", `${booking.path}/calendar.ics`);
  const response = await page.request.get((await calendar.getAttribute("href"))!);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("text/calendar");
  expect(await response.text()).toContain("BEGIN:VEVENT");
  await expect(page.getByText(dateLabel(booking.date), { exact: true })).toBeVisible();
});

test("owner sees wrong-password feedback and can log in", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText("Wrong email or password.", { exact: true })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("local-dev-only");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("owner approves a fresh booking and the customer sees confirmation", async ({ page, context, customer }) => {
  const person = customer();
  const booking = await book(page, person);
  const admin = await context.newPage();
  await login(admin);
  await admin.getByRole("link", { name: new RegExp(person.name) }).click();
  await expect(admin).toHaveURL(/\/admin\/bookings\/\d+$/);
  await admin.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(admin.getByRole("button", { name: "Completed", exact: true })).toBeVisible();
  await page.goto(booking.path);
  await expect(page.getByText(confirmed, { exact: false })).toBeVisible();
});

test("customer changes time, cancels, and another customer books the released slot", async ({ page, customer }) => {
  const booking = await book(page, customer());
  await page.getByRole("link", { name: "Change time", exact: true }).click();
  const changed = await futureSlot(page, undefined, booking.time, booking.date);
  expect(changed.date).toBe(booking.date);
  await page.getByRole("button", { name: "Change time", exact: true }).click();
  await expect(page).toHaveURL(/\?moved=1$/);
  await expect(page.getByText(pending, { exact: false })).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toBe("Cancel this booking?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Cancel booking", exact: true }).click();
  await expect(page.getByText("This booking was cancelled.", { exact: true })).toBeVisible();
  const replacement = await book(page, customer(), changed);
  expect(replacement.startsAt).toBe(changed.startsAt);
});

test("stale second customer cannot double-book the same slot", async ({ page, browser, customer }) => {
  const first = customer();
  const second = customer();
  const otherContext = await browser.newContext({ baseURL: "http://localhost:3000", viewport: { width: 390, height: 844 } });
  try {
    await english(otherContext);
    const other = await otherContext.newPage();
    await timeStep(page);
    const chosen = await futureSlot(page);
    await details(page, first);
    await timeStep(other);
    const competing = await futureSlot(other, chosen);
    expect(competing).toEqual(chosen);
    await details(other, second);
    await submit(page);
    await other.getByRole("button", { name: "Book now", exact: true }).click();
    await expect(other.getByRole("alert").filter({ hasText: "Sorry, that time was just taken" })).toContainText("Sorry, that time was just taken");
    const rows = storedBookings([first.name, second.name]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ customer_name: first.name, starts_at: chosen.startsAt });
  } finally {
    await otherContext.close();
  }
});

test("instant mode confirms immediately and the phone limit rejects a third booking", async ({ page, context, customer }) => {
  const admin = await context.newPage();
  await login(admin);
  await admin.goto("/admin/settings");
  const limit = admin.getByLabel("Max upcoming bookings per phone number", { exact: true });
  const originalLimit = await limit.inputValue();
  try {
    await admin.getByText("Confirm instantly", { exact: true }).click();
    await expect(admin.locator('input[name="bookingMode"][value="instant"]')).toBeChecked();
    await limit.fill("2");
    await admin.getByRole("button", { name: "Save", exact: true }).click();
    await expect(admin.getByText("Saved.", { exact: true })).toBeVisible();
    const first = customer();
    const second = { ...customer(), phone: first.phone };
    const third = { ...customer(), phone: first.phone };
    await book(page, first);
    await expect(page.getByText(confirmed, { exact: false })).toBeVisible();
    await book(page, second);
    await expect(page.getByText(confirmed, { exact: false })).toBeVisible();
    await timeStep(page);
    await futureSlot(page);
    await details(page, third);
    await page.getByRole("button", { name: "Book now", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "maximum number" })).toHaveText("You already have the maximum number of upcoming bookings.");
    expect(storedBookings([first.name, second.name, third.name])).toHaveLength(2);
  } finally {
    await admin.goto("/admin/settings");
    await admin.getByText("Wait for my approval", { exact: true }).click();
    await expect(admin.locator('input[name="bookingMode"][value="approval"]')).toBeChecked();
    await admin.getByLabel("Max upcoming bookings per phone number", { exact: true }).fill(originalLimit);
    await admin.getByRole("button", { name: "Save", exact: true }).click();
    await expect(admin.getByText("Saved.", { exact: true })).toBeVisible();
  }
});

test("default Arabic switches to English through the footer and persists on book", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator("footer").getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.goto("/book");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  expect((await context.cookies()).find((cookie) => cookie.name === "NEXT_LOCALE")?.value).toBe("en");
});

test("owner uploads a PNG favicon and the public page serves it", async ({ page }) => {
  await login(page);
  await page.goto("/admin/profile");
  // Generate the asset in Chromium without introducing another dependency.
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    const drawing = canvas.getContext("2d")!;
    drawing.fillStyle = "#c86024";
    drawing.fillRect(0, 0, 16, 16);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const field = page.locator("div.space-y-3").filter({ has: page.getByText("Browser tab icon", { exact: true }) });
  const picker = field.locator('input[type="file"]:not([hidden])');
  const form = page.locator("form").filter({ has: picker });
  try {
    await picker.setInputFiles({ name: "favicon.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    await expect.poll(() => form.locator('input[name="favicon"]').evaluate((input) => (input as HTMLInputElement).files?.[0]?.type)).toBe("image/png");
    await form.getByRole("button", { name: "Save", exact: true }).click();
    await expect(form.getByText("Saved.", { exact: true })).toBeVisible();
    await page.goto("/");
    const icon = page.locator('link[rel="icon"]');
    await expect(icon).toHaveAttribute("href", /^\/media\/profile\/[^/]+\.png$/);
    const response = await page.request.get((await icon.getAttribute("href"))!);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  } finally {
    await page.goto("/admin/profile");
    const removal = page.locator('input[name="removeFavicon"]');
    if (await removal.count()) {
      await removal.check();
      const containingForm = page.locator("form").filter({ has: page.locator('input[name="favicon"]') });
      await containingForm.getByRole("button", { name: "Save", exact: true }).click();
      await expect(containingForm.getByText("Saved.", { exact: true })).toBeVisible();
    }
  }
});

test("closed Friday offers no slots", async ({ page }) => {
  await timeStep(page);
  const start = today();
  let offset = 1;
  while (new Date(`${plusDays(start, offset)}T12:00:00Z`).getUTCDay() !== 5) offset++;
  const date = plusDays(start, offset);
  await expect(dayChips(page).nth(offset)).toBeDisabled();
  const response = await page.request.get(slotsPath(page, date));
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ slots: [] });
});
