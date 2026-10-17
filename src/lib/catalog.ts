import "server-only";
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import {
  optionGroups,
  options,
  services,
  serviceTypes,
  staff,
  staffServices,
  type Option,
  type OptionGroup,
  type Service,
  type ServiceType,
  type Staff,
} from "@/db/schema";

export type CatalogGroup = OptionGroup & { options: Option[] };
export type CatalogService = Service & { groups: CatalogGroup[]; staffIds: number[] };
export type CatalogType = ServiceType & { services: CatalogService[] };
export type StaffMember = Staff & { serviceIds: number[] };

/** All service types with their (non-archived) services, option groups and options. */
export const getCatalog = cache(async (): Promise<CatalogType[]> => {
  const db = getDb();
  const [typeRows, serviceRows, groupRows, optionRows, assignments] = await db.batch([
    db.select().from(serviceTypes).orderBy(asc(serviceTypes.sortOrder), asc(serviceTypes.id)),
    db
      .select()
      .from(services)
      .where(eq(services.isArchived, false))
      .orderBy(asc(services.sortOrder), asc(services.id)),
    db.select().from(optionGroups).orderBy(asc(optionGroups.sortOrder), asc(optionGroups.id)),
    db.select().from(options).orderBy(asc(options.sortOrder), asc(options.id)),
    db
      .select({ staffId: staffServices.staffId, serviceId: staffServices.serviceId })
      .from(staffServices)
      .innerJoin(staff, eq(staff.id, staffServices.staffId))
      .where(eq(staff.isActive, true)),
  ]);

  const groups = groupRows.map((group) => ({
    ...group,
    options: optionRows.filter((option) => option.groupId === group.id),
  }));

  return typeRows.map((type) => ({
    ...type,
    services: serviceRows
      .filter((service) => service.typeId === type.id)
      .map((service) => ({
        ...service,
        groups: groups.filter((group) => group.serviceId === service.id),
        staffIds: assignments.filter((a) => a.serviceId === service.id).map((a) => a.staffId),
      })),
  }));
});

export async function findService(serviceId: number): Promise<CatalogService | undefined> {
  const catalog = await getCatalog();
  return catalog.flatMap((type) => type.services).find((service) => service.id === serviceId);
}

export async function getArchivedServices(): Promise<Service[]> {
  return getDb()
    .select()
    .from(services)
    .where(eq(services.isArchived, true))
    .orderBy(asc(services.sortOrder), asc(services.id));
}

/** Visible types and services that customers can book online. */
export async function getBookableCatalog(): Promise<CatalogType[]> {
  const catalog = await getCatalog();
  return catalog
    .filter((type) => type.isVisible)
    .map((type) => ({
      ...type,
      services: type.services.filter(
        (service) => service.isVisible && service.bookableOnline && service.staffIds.length > 0,
      ),
    }))
    .filter((type) => type.services.length > 0);
}

export const getStaff = cache(async (): Promise<StaffMember[]> => {
  const db = getDb();
  const [staffRows, assignments] = await db.batch([
    db.select().from(staff).orderBy(asc(staff.sortOrder), asc(staff.id)),
    db.select().from(staffServices),
  ]);
  return staffRows.map((member) => ({
    ...member,
    serviceIds: assignments.filter((a) => a.staffId === member.id).map((a) => a.serviceId),
  }));
});

export async function getActiveStaff(): Promise<StaffMember[]> {
  return (await getStaff()).filter((member) => member.isActive);
}
