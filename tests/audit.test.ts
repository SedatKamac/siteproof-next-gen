import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeHtml } from "../lib/audit";

test("scores a healthy minimal homepage above a broken one", () => {
  const headers = new Headers({ "content-security-policy": "default-src 'self'", "strict-transport-security": "max-age=1", "x-frame-options": "DENY", "referrer-policy": "strict-origin" });
  const healthy = analyzeHtml(`<html><head><title>A useful title for a useful company</title><meta name="description" content="A detailed description of this useful company and its services for local customers."><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://example.com"><script type="application/ld+json">{}</script></head><body><h1>Company</h1><p>${"helpful words ".repeat(300)}</p><img alt="team"></body></html>`, "https://example.com", "https://example.com", 200, 350, headers);
  const broken = analyzeHtml(`<html><body><img></body></html>`, "http://example.com", "http://example.com", 200, 3000, new Headers());
  assert.ok(healthy.score > broken.score);
  assert.ok(broken.issues.some(issue => issue.severity === "Critical"));
});
