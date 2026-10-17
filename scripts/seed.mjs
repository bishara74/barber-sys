#!/usr/bin/env node
// Fills an empty database with demo content: a profile, links, services with options,
// two staff members with working hours, a few products, and customers with bookings
// spread around today (past visits, today's agenda, pending approvals).
//
//   npm run db:seed:local
//   node scripts/seed.mjs <slug>        (a client's remote database, e.g. for a demo site)
//   node scripts/seed.mjs --local --no-bookings   (content only)
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { clientConfig, executeSql, fail, parseTarget, querySql, ROOT, sqlString as q } from "./lib.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { local: { type: "boolean" }, "no-bookings": { type: "boolean" } },
});
const target = parseTarget(positionals, values);

const [{ total }] = querySql("SELECT count(*) AS total FROM service_types", target);
if (total > 0) fail("This database already has services. The seed only runs on an empty database.");

const profile = {
  nameEn: "Abu Ali Barbershop",
  nameAr: "صالون أبو علي",
  taglineEn: "Classic cuts and fresh fades since 1998",
  taglineAr: "قصّات كلاسيكية وحديثة منذ 1998",
  bioEn: "Walk-ins welcome, but booking guarantees your chair.",
  bioAr: "نستقبل الزبائن بدون موعد، لكن الحجز يضمن دورك.",
  addressEn: "Star Street, Bethlehem",
  addressAr: "شارع النجمة، بيت لحم",
  mapUrl: "https://maps.google.com/?q=Bethlehem",
  phone: "970591234567",
  whatsapp: "970591234567",
  avatarKey: "",
  coverKey: "",
};

const hours = (staffId, shifts) =>
  [0, 1, 2, 3, 4, 6] // Sunday to Thursday and Saturday; Friday off
    .flatMap((weekday) => shifts.map(([start, end]) => `(${staffId}, ${weekday}, ${start * 60}, ${end * 60})`))
    .join(",\n  ");

executeSql(
  `
INSERT INTO config (key, value) VALUES ('profile', ${q(JSON.stringify(profile))});

INSERT INTO links (kind, platform, url, sort_order) VALUES
  ('social', 'instagram', 'instagram.com/abuali.barber', 0),
  ('social', 'tiktok', 'tiktok.com/@abuali.barber', 1),
  ('social', 'whatsapp', '+970591234567', 2),
  ('social', 'maps', 'https://maps.google.com/?q=Bethlehem', 3);
INSERT INTO links (kind, label_en, label_ar, url, sort_order) VALUES
  ('button', 'See our latest cuts', 'شاهد أحدث القصات', 'https://instagram.com/abuali.barber', 0);

INSERT INTO service_types (id, name_en, name_ar, sort_order) VALUES
  (1, 'Barbershop', 'حلاقة', 0),
  (2, 'Tattoo', 'وشم', 1);

INSERT INTO services (id, type_id, name_en, name_ar, description_en, description_ar, price, price_is_from, duration_min, buffer_min, sort_order) VALUES
  (1, 1, 'Haircut', 'قص شعر', 'Wash, cut and style', 'غسيل وقص وتصفيف', 4000, 0, 30, 5, 0),
  (2, 1, 'Hair + beard', 'شعر + لحية', 'Full haircut with beard shaping', 'قص شعر كامل مع تحديد اللحية', 5500, 0, 45, 5, 1),
  (3, 1, 'Kids haircut', 'قص شعر أطفال', 'Under 12', 'تحت 12 سنة', 3000, 0, 20, 5, 2),
  (4, 1, 'Hot towel shave', 'حلاقة بالمنشفة الساخنة', '', '', 2500, 0, 20, 5, 3),
  (5, 2, 'Small tattoo', 'وشم صغير', 'Up to 5 cm', 'حتى 5 سم', 15000, 1, 60, 15, 0),
  (6, 2, 'Consultation', 'استشارة', 'Talk through your idea', 'نناقش فكرتك', 0, 0, 15, 0, 1);

INSERT INTO option_groups (id, service_id, name_en, name_ar, selection, is_required, sort_order) VALUES
  (1, 1, 'Add-ons', 'إضافات', 'multiple', 0, 0),
  (2, 1, 'Hair length', 'طول الشعر', 'single', 1, 1),
  (3, 5, 'Style', 'النوع', 'single', 1, 0);

INSERT INTO options (group_id, name_en, name_ar, price_delta, duration_delta, sort_order) VALUES
  (1, 'Beard trim', 'ترتيب اللحية', 2000, 15, 0),
  (1, 'Hair wash', 'غسيل شعر', 1000, 10, 1),
  (1, 'Black mask', 'ماسك أسود', 1500, 10, 2),
  (2, 'Short', 'قصير', 0, 0, 0),
  (2, 'Long', 'طويل', 1000, 15, 1),
  (3, 'Black & grey', 'أسود ورمادي', 0, 0, 0),
  (3, 'Color', 'ملون', 5000, 30, 1);

INSERT INTO staff (id, name, sort_order) VALUES (1, 'Ali', 0), (2, 'Sami', 1);

INSERT INTO staff_services (staff_id, service_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4),
  (2, 1), (2, 2), (2, 5), (2, 6);

INSERT INTO working_hours (staff_id, weekday, start_min, end_min) VALUES
  ${hours(1, [[9, 13], [14, 20]])},
  ${hours(2, [[12, 21]])};

INSERT INTO products (id, name_en, name_ar, description_en, description_ar, price, sort_order) VALUES
  (1, 'Matte hair wax', 'واكس شعر مطفي', 'Strong hold, natural finish.', 'تثبيت قوي بمظهر طبيعي.', 3500, 0),
  (2, 'Beard oil', 'زيت لحية', 'Argan and cedarwood.', 'أرغان وخشب الأرز.', 4500, 1);
`,
  target,
);

if (!values["no-bookings"]) seedBookings();

console.log("\n✔ Demo content added. Create a login with: npm run owner:local -- --email you@example.com\n");

/** The shop's time zone from the Wrangler config, so demo bookings land on the right local hours. */
function timeZoneOf() {
  const file = target.local ? join(ROOT, "wrangler.jsonc") : clientConfig(target.slug);
  const config = existsSync(file) ? readFileSync(file, "utf8") : "";
  return /"TIMEZONE"\s*:\s*"([^"]+)"/.exec(config)?.[1] ?? "Asia/Jerusalem";
}

/** Milliseconds a time zone is ahead of UTC at an instant. */
function zoneOffset(ms, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(ms);
  const part = (type) => Number(parts.find((p) => p.type === type).value);
  return Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second")) - ms;
}

/** The instant of a local date ("2026-10-15") and minutes from midnight in a time zone. */
function zonedTime(date, minutes, timeZone) {
  const [y, m, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const guess = wall - zoneOffset(wall, timeZone);
  return wall - zoneOffset(guess, timeZone);
}

function addDays(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Customers and bookings around today, in every state, so the dashboard and calendar look alive. */
function seedBookings() {
  const timeZone = timeZoneOf();
  const now = Date.now();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  // The demo shop is closed on Fridays: move bookings that would land there to the next day.
  const dayAt = (offset) => {
    const date = addDays(today, offset);
    return offset !== 0 && new Date(`${date}T12:00:00Z`).getUTCDay() === 5 ? addDays(date, offset > 0 ? 1 : -1) : date;
  };

  const customers = [
    ["عمر خليل", "970599111222", "Prefers a number 2 on the sides."],
    ["Yousef Haddad", "970598333444", ""],
    ["خالد ناصر", "970597555666", ""],
    ["Rami Saleh", "970596777888", "Always on time. Likes a hot towel."],
    ["مجد عوض", "970595999000", ""],
    ["Fadi Qassis", "970594123123", ""],
  ];

  // id: [nameEn, nameAr, price, isFrom, duration, buffer]
  const services = {
    1: ["Haircut", "قص شعر", 4000, 0, 30, 5],
    2: ["Hair + beard", "شعر + لحية", 5500, 0, 45, 5],
    3: ["Kids haircut", "قص شعر أطفال", 3000, 0, 20, 5],
    4: ["Hot towel shave", "حلاقة بالمنشفة الساخنة", 2500, 0, 20, 5],
    5: ["Small tattoo", "وشم صغير", 15000, 1, 60, 15],
    6: ["Consultation", "استشارة", 0, 0, 15, 0],
  };
  const option = {
    short: ["Hair length", "طول الشعر", "Short", "قصير", 0, 0],
    long: ["Hair length", "طول الشعر", "Long", "طويل", 1000, 15],
    beard: ["Add-ons", "إضافات", "Beard trim", "ترتيب اللحية", 2000, 15],
    wash: ["Add-ons", "إضافات", "Hair wash", "غسيل شعر", 1000, 10],
    color: ["Style", "النوع", "Color", "ملون", 5000, 30],
    blackGrey: ["Style", "النوع", "Black & grey", "أسود ورمادي", 0, 0],
  };

  // [day offset, "HH:MM", staff, service, options, customer (1-based, 0 = walk-in), source, status, note]
  // Status "auto" means completed once the appointment is over, confirmed before that.
  const plan = [
    [-7, "10:00", 1, 1, ["short"], 1, "online", "completed", ""],
    [-7, "13:00", 2, 5, ["blackGrey"], 2, "admin", "completed", ""],
    [-5, "11:00", 1, 2, [], 3, "online", "no_show", ""],
    [-3, "16:00", 1, 1, ["short", "beard"], 4, "online", "completed", ""],
    [-2, "18:00", 2, 1, ["long"], 5, "online", "cancelled", ""],
    [-1, "09:30", 1, 3, [], 0, "walk_in", "completed", ""],
    [-1, "15:00", 2, 2, [], 1, "online", "completed", ""],
    [0, "09:00", 1, 1, ["short"], 1, "online", "auto", ""],
    [0, "10:00", 1, 2, [], 2, "admin", "auto", ""],
    [0, "11:30", 1, 4, [], 6, "online", "auto", ""],
    [0, "12:30", 2, 5, ["color"], 3, "online", "auto", "A small rose on the wrist, please."],
    [0, "14:00", 1, 1, ["short", "wash"], 4, "online", "auto", ""],
    [0, "16:00", 2, 6, [], 5, "online", "auto", ""],
    [0, "17:30", 1, 3, [], 6, "admin", "auto", "Bringing his son, 8 years old."],
    [1, "10:00", 1, 1, ["short"], 3, "online", "pending", ""],
    [1, "13:00", 2, 5, ["blackGrey"], 6, "online", "pending", "Name in Arabic calligraphy."],
    [1, "17:00", 1, 2, [], 1, "online", "confirmed", ""],
    [2, "11:00", 2, 1, ["long"], 4, "admin", "confirmed", ""],
    [3, "15:00", 1, 4, [], 5, "online", "confirmed", ""],
    [4, "12:00", 2, 6, [], 2, "online", "confirmed", ""],
  ];

  const rows = plan.map(([offset, clock, staffId, serviceId, optionKeys, customer, source, status, note]) => {
    const [nameEn, nameAr, basePrice, isFrom, baseDuration, buffer] = services[serviceId];
    const chosen = optionKeys.map((key) => {
      const [groupNameEn, groupNameAr, optionEn, optionAr, priceDelta, durationDelta] = option[key];
      return { groupNameEn, groupNameAr, nameEn: optionEn, nameAr: optionAr, priceDelta, durationDelta };
    });
    const duration = baseDuration + chosen.reduce((sum, o) => sum + o.durationDelta, 0);
    const price = basePrice + chosen.reduce((sum, o) => sum + o.priceDelta, 0);
    const [hours, minutes] = clock.split(":").map(Number);
    const startsAt = zonedTime(dayAt(offset), hours * 60 + minutes, timeZone);
    const endsAt = startsAt + duration * 60_000;
    const finalStatus = status === "auto" ? (endsAt < now ? "completed" : "confirmed") : status;
    const [customerName, customerPhone] = customer ? customers[customer - 1] : ["Walk-in", ""];
    return [
      q(randomBytes(16).toString("hex")),
      staffId,
      customer ? `(SELECT id FROM customers WHERE phone = ${q(customerPhone)})` : "NULL",
      serviceId,
      q(nameEn),
      q(nameAr),
      q(JSON.stringify(chosen)),
      price,
      isFrom,
      duration,
      startsAt,
      endsAt,
      endsAt + buffer * 60_000,
      q(finalStatus),
      q(source),
      q(customerName),
      q(customerPhone),
      q(note),
      finalStatus === "pending" ? now + 12 * 3_600_000 : "NULL",
      // Online bookings were made a day or two before; the rest at the appointment.
      Math.min(now, source === "online" ? startsAt - 36 * 3_600_000 : startsAt),
    ];
  });

  executeSql(
    `
INSERT INTO customers (name, phone, notes) VALUES
  ${customers.map(([name, phone, notes]) => `(${q(name)}, ${q(phone)}, ${q(notes)})`).join(",\n  ")};

INSERT INTO bookings (token, staff_id, customer_id, service_id, service_name_en, service_name_ar, options, price,
  price_is_from, duration_min, starts_at, ends_at, blocked_until, status, source, customer_name, customer_phone,
  customer_note, pending_expires_at, created_at) VALUES
  ${rows.map((row) => `(${row.join(", ")})`).join(",\n  ")};
`,
    target,
  );
}
