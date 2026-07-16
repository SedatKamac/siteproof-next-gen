export const runtime = "edge";

type Input = { url?: string; score?: number; responseMs?: number; status?: number; scores?: Record<string, number>; tech?: string[]; features?: Record<string, boolean>; social?: string[]; metrics?: Record<string, string | number>; issues?: { severity?: string; title?: string; why?: string; fix?: string }[] };
const schema = { type: "object", properties: { executiveSummary: { type: "string" }, strengths: { type: "array", items: { type: "string" } }, weaknesses: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } }, salesPotential: { type: "string", enum: ["Düşük", "Orta", "Yüksek"] }, redesignReason: { type: "string" }, salesPitch: { type: "string" } }, required: ["executiveSummary", "strengths", "weaknesses", "recommendations", "salesPotential", "redesignReason", "salesPitch"] };

function safeReport(input: Input) {
  return { url: String(input.url || "").slice(0, 300), websiteScore: Number(input.score) || 0, responseMs: Number(input.responseMs) || 0, httpStatus: Number(input.status) || 0, categoryScores: input.scores || {}, technologies: (input.tech || []).slice(0, 30).map(String), businessFeatures: input.features || {}, socialProfiles: (input.social || []).slice(0, 20).map(String), pageMetrics: input.metrics || {}, issues: (input.issues || []).slice(0, 30).map(issue => ({ severity: String(issue.severity || ""), problem: String(issue.title || "").slice(0, 200), why: String(issue.why || "").slice(0, 300), fix: String(issue.fix || "").slice(0, 400) })) };
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "AI bağlantısı hazır; ücretsiz Gemini API anahtarının sunucuya eklenmesi gerekiyor." }, { status: 503 });
  try {
    const prompt = `Sen deneyimli bir web ajansı danışmanısın. Aşağıdaki yalnızca yapılandırılmış teknik denetim JSON'unu Türkçe yorumla. HTML, DOM veya ekran görüntüsü yoktur. Bulguların dışına çıkma; uydurma yapma. İyi ve kötü yönleri somut anlat, düzeltmeleri öncelik sırasıyla ve uygulanabilir biçimde yaz. Yönetici özeti 3-5 cümle olsun. En fazla 5 güçlü yön, 5 zayıf yön ve 5 öneri ver. Toplam çıktı 250 kelimeyi aşmasın. Satış metni kısa, profesyonel ve baskıcı olmayan bir ajans mesajı olsun.\n\n${JSON.stringify(safeReport(await request.json() as Input))}`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1/interactions", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ model: "gemini-2.5-flash-lite", input: prompt, response_format: { type: "text", mime_type: "application/json", schema }, generation_config: { temperature: 0.25, max_output_tokens: 900 } }) });
    if (!response.ok) { const failure = await response.text(); console.error("Gemini failed", response.status, failure.slice(0, 500)); return Response.json({ error: response.status === 429 ? "Ücretsiz AI kotası doldu; kısa süre sonra tekrar deneyin." : response.status === 401 || response.status === 403 ? `Gemini API anahtarı reddedildi (${response.status}).` : `Yapay zekâ servisi hata verdi (${response.status}).` }, { status: 502 }); }
    const data = await response.json() as { steps?: { type?: string; content?: { type?: string; text?: string }[] }[] };
    const text = data.steps?.find(step => step.type === "model_output")?.content?.find(content => content.type === "text")?.text || "{}";
    const output = JSON.parse(text) as Record<string, unknown>;
    if (!output.executiveSummary || !Array.isArray(output.recommendations)) throw new Error("Invalid AI response");
    return Response.json({ ...output, provider: "Gemini 2.5 Flash‑Lite" }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("AI summary error", error); return Response.json({ error: "Yapay zekâ yorumu şu anda oluşturulamadı." }, { status: 502 }); }
}
