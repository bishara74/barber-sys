import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
const sortOrder = () => integer("sort_order").notNull().default(0);
const flag = (name: string, value: boolean) =>
  integer(name, { mode: "boolean" }).notNull().default(value);

/** Key/value store for the shop profile and settings (validated by Zod in lib/config). */
export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export const USER_ROLES = ["owner", "staff"] as const;

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: USER_ROLES }).notNull().default("staff"),
  staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  /** SHA-256 of the session token; the raw token only lives in the cookie. */
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

export const LINK_KINDS = ["social", "button"] as const;
export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "facebook",
  "snapchat",
  "whatsapp",
  "youtube",
  "x",
  "telegram",
  "threads",
  "phone",
  "email",
  "maps",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Social icons and custom link buttons on the public profile page. */
export const links = sqliteTable("links", {
  id: id(),
  kind: text("kind", { enum: LINK_KINDS }).notNull(),
  platform: text("platform", { enum: SOCIAL_PLATFORMS }),
  labelEn: text("label_en").notNull().default(""),
  labelAr: text("label_ar").notNull().default(""),
  url: text("url").notNull(),
  isVisible: flag("is_visible", true),
  sortOrder: sortOrder(),
});

export const products = sqliteTable("products", {
  id: id(),
  nameEn: text("name_en").notNull().default(""),
  nameAr: text("name_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  /** Minor units (agorot). Null means "price on request". */
  price: integer("price"),
  isVisible: flag("is_visible", true),
  inStock: flag("in_stock", true),
  sortOrder: sortOrder(),
  createdAt: createdAt(),
});

export const productImages = sqliteTable(
  "product_images",
  {
    id: id(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    sortOrder: sortOrder(),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/** Top-level service categories, e.g. Barbershop, Tattoo, Hair styling. */
export const serviceTypes = sqliteTable("service_types", {
  id: id(),
  nameEn: text("name_en").notNull().default(""),
  nameAr: text("name_ar").notNull().default(""),
  isVisible: flag("is_visible", true),
  sortOrder: sortOrder(),
});

export const services = sqliteTable(
  "services",
  {
    id: id(),
    typeId: integer("type_id")
      .notNull()
      .references(() => serviceTypes.id),
    nameEn: text("name_en").notNull().default(""),
    nameAr: text("name_ar").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    /** Minor units. Null means "price on request". */
    price: integer("price"),
    priceIsFrom: flag("price_is_from", false),
    durationMin: integer("duration_min").notNull(),
    bufferMin: integer("buffer_min").notNull().default(0),
    bookableOnline: flag("bookable_online", true),
    isVisible: flag("is_visible", true),
    isArchived: flag("is_archived", false),
    sortOrder: sortOrder(),
    createdAt: createdAt(),
  },
  (t) => [index("services_type_idx").on(t.typeId)],
);

export const OPTION_SELECTIONS = ["single", "multiple"] as const;
export type OptionSelection = (typeof OPTION_SELECTIONS)[number];

/** A set of choices under a service, e.g. "Add-ons" (multiple) or "Hair length" (single). */
export const optionGroups = sqliteTable(
  "option_groups",
  {
    id: id(),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull().default(""),
    nameAr: text("name_ar").notNull().default(""),
    selection: text("selection", { enum: OPTION_SELECTIONS }).notNull().default("multiple"),
    isRequired: flag("is_required", false),
    sortOrder: sortOrder(),
  },
  (t) => [index("option_groups_service_idx").on(t.serviceId)],
);

export const options = sqliteTable(
  "options",
  {
    id: id(),
    groupId: integer("group_id")
      .notNull()
      .references(() => optionGroups.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull().default(""),
    nameAr: text("name_ar").notNull().default(""),
    /** Added to the service price, in minor units. */
    priceDelta: integer("price_delta").notNull().default(0),
    /** Added to the service duration, in minutes. */
    durationDelta: integer("duration_delta").notNull().default(0),
    sortOrder: sortOrder(),
  },
  (t) => [index("options_group_idx").on(t.groupId)],
);

export const staff = sqliteTable("staff", {
  id: id(),
  name: text("name").notNull(),
  avatarKey: text("avatar_key"),
  isActive: flag("is_active", true),
  sortOrder: sortOrder(),
});

export const staffServices = sqliteTable(
  "staff_services",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.serviceId] })],
);

/** Weekly shifts. Several rows on the same weekday model breaks (e.g. 09:00-13:00, 14:00-19:00). */
export const workingHours = sqliteTable(
  "working_hours",
  {
    id: id(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    /** 0 = Sunday ... 6 = Saturday */
    weekday: integer("weekday").notNull(),
    /** Minutes from local midnight. */
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
  },
  (t) => [index("working_hours_staff_idx").on(t.staffId)],
);

/** Days off, holidays and blocked time. A null staff_id closes the whole shop. */
export const timeOff = sqliteTable(
  "time_off",
  {
    id: id(),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "cascade" }),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    reason: text("reason").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("time_off_range_idx").on(t.startsAt, t.endsAt)],
);

export const customers = sqliteTable("customers", {
  id: id(),
  name: text("name").notNull(),
  /** Digits only, international format (e.g. 970591234567). */
  phone: text("phone").notNull().unique(),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "no_show",
  "cancelled",
  "declined",
  "expired",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_SOURCES = ["online", "admin", "walk_in"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

export type BookedOption = {
  groupNameEn: string;
  groupNameAr: string;
  nameEn: string;
  nameAr: string;
  priceDelta: number;
  durationDelta: number;
};

export const bookings = sqliteTable(
  "bookings",
  {
    id: id(),
    /** Secret for the customer's private manage link. */
    token: text("token").notNull().unique(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
    // Snapshot of what was booked, so later price or name changes never rewrite history.
    serviceNameEn: text("service_name_en").notNull(),
    serviceNameAr: text("service_name_ar").notNull(),
    options: text("options", { mode: "json" }).$type<BookedOption[]>().notNull().default([]),
    price: integer("price"),
    priceIsFrom: flag("price_is_from", false),
    durationMin: integer("duration_min").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    /** endsAt plus the service buffer. The slot is occupied until this moment. */
    blockedUntil: integer("blocked_until", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: BOOKING_STATUSES }).notNull(),
    source: text("source", { enum: BOOKING_SOURCES }).notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull().default(""),
    customerNote: text("customer_note").notNull().default(""),
    staffNote: text("staff_note").notNull().default(""),
    pendingExpiresAt: integer("pending_expires_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("bookings_staff_start_idx").on(t.staffId, t.startsAt),
    index("bookings_start_idx").on(t.startsAt),
    index("bookings_status_idx").on(t.status),
    index("bookings_customer_idx").on(t.customerId),
    index("bookings_phone_idx").on(t.customerPhone),
  ],
);

export type Booking = typeof bookings.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type OptionGroup = typeof optionGroups.$inferSelect;
export type Option = typeof options.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Link = typeof links.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type TimeOff = typeof timeOff.$inferSelect;
