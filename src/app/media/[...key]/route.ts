import { getBindings } from "@/lib/env";

/** Serves uploaded images from R2. Keys are unique per upload, so they can be cached forever. */
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  const key = (await params).key.join("/");
  const object = await getBindings().MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
