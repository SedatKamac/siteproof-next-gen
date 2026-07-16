import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/summary/route";

test("AI route never calls a provider without a server-side key", async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const response = await POST(new Request("https://siteproof.test/api/summary", { method: "POST", body: "{}" }));
  assert.equal(response.status, 503);
  if (previous) process.env.GEMINI_API_KEY = previous;
});
