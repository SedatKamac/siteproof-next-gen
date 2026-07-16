import { analyzeHtml } from "../../../lib/audit";

export const runtime = "edge";

function publicUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) throw new Error("Enter a valid website URL.");
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Only public HTTP or HTTPS websites can be audited.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host === "::1") throw new Error("Private network addresses cannot be audited.");
  return url;
}

export async function POST(request: Request) {
  try {
    const target = publicUrl((await request.json()).url);
    const started = Date.now();
    const response = await fetch(target, { redirect: "follow", headers: { "user-agent": "SiteproofAudit/1.0", accept: "text/html" }, signal: AbortSignal.timeout(12000) });
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) throw new Error("That URL did not return an HTML page.");
    const body = await response.text();
    if (body.length > 2_000_000) throw new Error("The homepage is too large to audit safely.");
    return Response.json(analyzeHtml(body, target.toString(), response.url, response.status, Date.now() - started, response.headers));
  } catch (cause) {
    return Response.json({ error: cause instanceof Error ? cause.message : "The website could not be audited." }, { status: 400 });
  }
}
