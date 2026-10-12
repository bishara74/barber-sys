import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { productImages, products, type Product } from "@/db/schema";

export type ProductWithImages = Product & { images: (typeof productImages.$inferSelect)[] };

async function withImages(rows: Product[]): Promise<ProductWithImages[]> {
  const ids = rows.map((product) => product.id);
  const images = ids.length
    ? await getDb()
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.sortOrder), asc(productImages.id))
    : [];
  return rows.map((product) => ({
    ...product,
    images: images.filter((image) => image.productId === product.id),
  }));
}

export async function getAllProducts(): Promise<ProductWithImages[]> {
  const rows = await getDb().select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
  return withImages(rows);
}

export async function getVisibleProducts(): Promise<ProductWithImages[]> {
  return (await getAllProducts()).filter((product) => product.isVisible);
}

export async function getProduct(id: number): Promise<ProductWithImages | undefined> {
  const row = await getDb().query.products.findFirst({ where: eq(products.id, id) });
  return row ? (await withImages([row]))[0] : undefined;
}
