#!/usr/bin/env node
// Fills an empty database with demo content: a profile, links, services with options,
// two staff members with working hours, and a few products.
//
//   npm run db:seed:local
//   node scripts/seed.mjs <slug>        (a client's remote database, e.g. for a demo site)
import { parseArgs } from "node:util";
import { executeSql, fail, parseTarget, querySql, sqlString as q } from "./lib.mjs";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { local: { type: "boolean" } } });
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

console.log("\n✔ Demo content added. Create a login with: npm run owner:local -- --email you@example.com\n");
