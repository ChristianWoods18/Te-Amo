import { list, get } from "@vercel/blob";

const authed = (r) => {
  try {
    const s = atob((r.headers.get("authorization") || "").split(" ")[1] || "");
    return !!process.env.ADMIN_PASSWORD && s.slice(s.indexOf(":") + 1) === process.env.ADMIN_PASSWORD;
  } catch { return false; }
};

export default async function handler(request) {
  if (!authed(request))
    return new Response("Login required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="admin"' } });

  const f = new URL(request.url).searchParams.get("f");
  if (f) {                                   // stream one image
    if (!f.startsWith("uploads/") || f.includes("..")) return new Response("Bad request", { status: 400 });
    const r = await get(f, { access: "private" });
    if (r?.statusCode !== 200) return new Response("Not found", { status: 404 });
    return new Response(r.stream, { headers: {
      "Content-Type": r.blob.contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  }

  const { blobs } = await list({ prefix: "uploads/", limit: 1000 });   // gallery page
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const html = `<body style="background:#111;color:#eee;font-family:serif"><h2>${blobs.length} uploads</h2>` +
    blobs.map(b => `<a href="/api/admin?f=${encodeURIComponent(b.pathname)}"><img src="/api/admin?f=${encodeURIComponent(b.pathname)}" width="160" loading="lazy" title="${new Date(b.uploadedAt).toLocaleString()}"></a>`).join(" ");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
