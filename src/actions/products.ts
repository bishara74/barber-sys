"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { productImages, products } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { failure, fields, parseForm, success, type ActionState } from "@/lib/forms";
import { deleteImages, isUpload, saveImage } from "@/lib/media";
import { nextSortOrder } from "@/lib/sort";

const productSchema = z
  .object({
    id: fields.optionalId,
    nameEn: fields.text(120),
    nameAr: fields.text(120),
    descriptionEn: fields.text(2000),
    descriptionAr: fields.text(2000),
    price: fields.money,
    isVisible: fields.checkbox,
    inStock: fields.checkbox,
  })
  .refine((value) => Boolean(value.nameEn || value.nameAr), { path: ["nameEn"], error: "Name required" });

export async function saveProduct(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = await parseForm(productSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...values } = parsed.data;
  const db = getDb();

  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
    refresh();
    return success();
  }
  const [created] = await db
    .insert(products)
    .values({ ...values, sortOrder: await nextSortOrder(products) })
    .returning({ id: products.id });
  redirect(`/admin/products/${created.id}`);
}

export async function deleteProduct(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("id"));
  const db = getDb();
  const images = await db.select().from(productImages).where(eq(productImages.productId, id));
  await db.delete(products).where(eq(products.id, id));
  await deleteImages(images.map((image) => image.key));
  redirect("/admin/products");
}

export async function addProductImages(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const productId = Number(formData.get("productId"));
  const files = formData.getAll("images").filter(isUpload);
  if (!Number.isInteger(productId) || files.length === 0) return failure("checkFields");

  try {
    let sortOrder = await nextSortOrder(productImages, eq(productImages.productId, productId));
    for (const file of files) {
      const key = await saveImage(file, "products");
      await getDb().insert(productImages).values({ productId, key, sortOrder: sortOrder++ });
    }
  } catch (error) {
    console.error(error);
    return failure("imageFailed");
  }
  refresh();
  return success();
}

export async function deleteProductImage(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("id"));
  const [image] = await getDb().delete(productImages).where(eq(productImages.id, id)).returning();
  if (image) await deleteImages([image.key]);
  refresh();
}
