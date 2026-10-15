import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

export default async function handler(request) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const file = (await request.formData()).get("image");
  const ext = file && EXT[file.type];
  if (!ext || file.size > 4 * 1024 * 1024) return new Response(null, { status: 400 });
  await put(`uploads/${Date.now()}-${randomUUID()}${ext}`, file, { access: "private" });
  return new Response(null, { status: 204 });
}
