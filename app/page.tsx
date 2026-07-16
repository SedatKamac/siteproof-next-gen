"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Issue = { severity: "Critical" | "High" | "Medium" | "Low"; title: string; why: string; fix: string };
type AiSummary = { executiveSummary: string; strengths: string[]; weaknesses: string[]; recommendations: string[]; salesPotential: "Düşük" | "Orta" | "Yüksek"; redesignReason: string; salesPitch: string; provider: string };
type Report = {
  url: string; finalUrl: string; analyzedAt: string; score: number; responseMs: number; status: number;
  scores: Record<string, number>; tech: string[]; features: Record<string, boolean>; social: string[];
  metrics: Record<string, string | number>; issues: Issue[]; summary: string; aiSummary?: AiSummary;
};

const demo: Report = {
  url: "https://northstar.studio", finalUrl: "https://northstar.studio/", analyzedAt: "2026-07-16T12:00:00.000Z",
  score: 68, responseMs: 1840, status: 200,
  scores: { Performance: 52, SEO: 74, Accessibility: 63, Security: 82, Content: 71, Business: 60, Mobile: 76 },
  tech: ["WordPress", "Elementor", "Cloudflare", "Google Analytics"],
  features: { "Contact form": true, WhatsApp: false, Booking: false, Testimonials: true, FAQ: false, Blog: true, Pricing: false, Newsletter: true },
  social: ["Instagram", "LinkedIn", "Facebook"],
  metrics: { Title: "Northstar Creative Studio", Words: 742, Images: 18, Links: 46, H1: 1, "Meta description": "Missing", TTFB: "1.84s", HTTPS: "Yes" },
  issues: [
    { severity: "High", title: "Slow initial response", why: "Visitors may leave before the page becomes useful.", fix: "Enable page caching and review hosting performance." },
    { severity: "High", title: "Meta description is missing", why: "Search results have no controlled sales message.", fix: "Add a unique 140–160 character description." },
    { severity: "Medium", title: "No booking path detected", why: "High-intent visitors cannot schedule immediately.", fix: "Add a prominent booking action to the header and contact section." },
    { severity: "Medium", title: "6 images lack alt text", why: "Screen readers and image search lose useful context.", fix: "Write concise, descriptive alt text for meaningful images." },
    { severity: "Low", title: "Twitter card metadata is missing", why: "Shared links may look generic.", fix: "Add summary-large-image card metadata." },
  ],
  summary: "The site has a credible foundation, but speed and lead-capture gaps reduce its commercial impact. Search fundamentals are mostly sound, while the missing description and weak booking journey leave easy wins. A focused redesign could improve conversion without replacing the entire stack. Sales potential: High."
};

const severityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function Home() {
  const [report, setReport] = useState<Report>(demo);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("Overview");
  const [history, setHistory] = useState<Report[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("siteproof-history") || "[]"));
    setTheme(localStorage.getItem("siteproof-theme") || "dark");
  }, []);

  async function analyze(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await response.json() as Report & { error?: string };
      if (!response.ok) throw new Error(data.error || "The audit could not be completed.");
      setReport(data); setTab("Overview"); setAiLoading(true); setAiError("");
      const aiResponse = await fetch("/api/summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      if (aiResponse.ok) { data.aiSummary = await aiResponse.json() as AiSummary; setReport({ ...data }); }
      else { const failure = await aiResponse.json() as { error?: string }; setAiError(failure.error || "Yapay zekâ yorumu oluşturulamadı."); }
      setAiLoading(false);
      const next = [data, ...history.filter((item) => item.finalUrl !== data.finalUrl)].slice(0, 8);
      setHistory(next); localStorage.setItem("siteproof-history", JSON.stringify(next));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  function save(type: "json" | "csv") {
    const content = type === "json" ? JSON.stringify(report, null, 2) : ["severity,issue,why,fix", ...report.issues.map(i => [i.severity, i.title, i.why, i.fix].map(v => `"${v.replaceAll('"', '""')}"`).join(","))].join("\n");
    const blob = new Blob([content], { type: type === "json" ? "application/json" : "text/csv" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `siteproof-audit.${type}`; link.click(); URL.revokeObjectURL(link.href);
  }

  const sortedIssues = useMemo(() => [...report.issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]), [report]);
  const domain = report.finalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return <div className={theme}>
    <main>
      <header>
        <a className="brand" href="#top" aria-label="Siteproof home"><span>SP</span><strong>Siteproof</strong></a>
        <nav aria-label="Main navigation"><a href="#report">Audit report</a><a href="#issues">Opportunities</a><a href="#history">History</a></nav>
        <button className="icon" aria-label="Toggle color theme" onClick={() => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("siteproof-theme", next); }}>{theme === "dark" ? "☼" : "◐"}</button>
      </header>

      <section className="hero" id="top">
        <div><p className="eyebrow"><i /> Deterministic website intelligence</p><h1>Find the gaps.<br/><em>Win the work.</em></h1><p>Turn any public homepage into a clear, agency-ready technical and commercial audit—without burning AI tokens on HTML.</p></div>
        <form onSubmit={analyze}>
          <label htmlFor="website">Website to audit</label><div className="urlbox"><span>↗</span><input id="website" required value={url} onChange={e => setUrl(e.target.value)} placeholder="example.com"/><button disabled={loading}>{loading ? "Scanning…" : "Run audit"}</button></div>
          <small>Safe fetch · No raw HTML sent to AI · Cached on this device</small>{error && <p className="error">{error}</p>}
        </form>
      </section>

      <section className="reportHead" id="report"><div><p className="eyebrow">Latest analysis</p><h2>{domain}</h2><p>Scanned {report.analyzedAt.slice(0, 16).replace("T", " ")} UTC · HTTP {report.status} · {report.responseMs}ms response</p></div><div className="actions"><button onClick={() => window.print()}>Print / PDF</button><button onClick={() => save("csv")}>CSV</button><button onClick={() => save("json")}>JSON</button></div></section>

      <section className="scoreGrid">
        <article className="overall"><div className="ring" style={{"--score": `${report.score * 3.6}deg`} as React.CSSProperties}><div><strong>{report.score}</strong><span>/100</span></div></div><div><p className="eyebrow">Overall website score</p><h3>{report.score >= 80 ? "Strong foundation" : report.score >= 60 ? "Good bones, clear upside" : "Redesign opportunity"}</h3><p>{report.issues.filter(i => i.severity === "High" || i.severity === "Critical").length} priority issues are holding back visibility, trust, or conversion.</p></div></article>
        <div className="categoryGrid">{Object.entries(report.scores).map(([name, score]) => <article key={name}><div><span>{name}</span><strong>{score}</strong></div><div className="bar"><i style={{width: `${score}%`}}/></div></article>)}</div>
      </section>

      <div className="tabs" role="tablist">{["Overview", "Issues", "Signals", "Summary"].map(name => <button role="tab" aria-selected={tab === name} onClick={() => setTab(name)} key={name}>{name}</button>)}</div>

      {tab === "Overview" && <section className="panelGrid">
        <article className="panel"><div className="panelTitle"><div><p className="eyebrow">Page signals</p><h3>What the crawler found</h3></div><span className="live">Live</span></div><div className="metricGrid">{Object.entries(report.metrics).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></article>
        <article className="panel"><p className="eyebrow">Commercial readiness</p><h3>Lead-generation features</h3><div className="features">{Object.entries(report.features).map(([name, found]) => <div key={name}><span>{found ? "✓" : "–"}</span>{name}<b className={found ? "yes" : "no"}>{found ? "Found" : "Missing"}</b></div>)}</div></article>
      </section>}

      {tab === "Issues" && <IssueList issues={sortedIssues}/>} 
      {tab === "Signals" && <section className="panelGrid"><article className="panel"><p className="eyebrow">Technology stack</p><h3>Detected technologies</h3><div className="chips">{report.tech.map(t => <span key={t}>{t}</span>)}</div></article><article className="panel"><p className="eyebrow">Social presence</p><h3>Connected channels</h3><div className="chips">{report.social.length ? report.social.map(t => <span key={t}>{t}</span>) : <p>No social profiles detected.</p>}</div></article></section>}
      {tab === "Summary" && <section className="aiReport"><div className="aiHeading"><div><p className="eyebrow">Yapay zekâ yorumu</p><h3>Teknik veriden iş değerlendirmesi</h3></div><span>{report.aiSummary?.provider || "Gemini 2.5 Flash‑Lite"}</span></div>{aiLoading ? <p className="aiState">Yapay zekâ teknik bulguları yorumluyor…</p> : report.aiSummary ? <><p className="executive">{report.aiSummary.executiveSummary}</p><div className="aiColumns"><div><h4>İyi yönler</h4>{report.aiSummary.strengths.map(item => <p key={item}>✓ {item}</p>)}</div><div><h4>Geliştirilmesi gerekenler</h4>{report.aiSummary.weaknesses.map(item => <p key={item}>– {item}</p>)}</div></div><div className="recommendations"><h4>Nasıl düzeltilmeli?</h4>{report.aiSummary.recommendations.map((item, index) => <div key={item}><b>{index + 1}</b><p>{item}</p></div>)}</div><div className="salesBox"><div><span>Satış potansiyeli</span><strong>{report.aiSummary.salesPotential}</strong></div><p>{report.aiSummary.redesignReason}</p></div><div className="pitch"><span>Ajans satış metni</span><p>{report.aiSummary.salesPitch}</p><button onClick={() => navigator.clipboard.writeText(report.aiSummary!.salesPitch)}>Satış metnini kopyala</button></div></> : <div className="aiState"><p>{aiError || "Yeni bir analiz başlattığınızda gerçek AI yorumu burada oluşacak."}</p><small>Teknik özet: {report.summary}</small></div>}</section>}

      <section id="issues" className="priority"><div><p className="eyebrow">Priority fixes</p><h2>The clearest route to a better site</h2></div><IssueList issues={sortedIssues.slice(0, 3)}/></section>

      <section className="history" id="history"><div><p className="eyebrow">Recent audits</p><h2>Compare and follow up</h2></div>{history.length ? <div className="historyList">{history.map(item => <button key={item.analyzedAt} onClick={() => setReport(item)}><span>{item.finalUrl.replace(/^https?:\/\//, "")}</span><b>{item.score}</b><small>{new Date(item.analyzedAt).toLocaleDateString()}</small></button>)}</div> : <p>Your completed audits will appear here on this device.</p>}</section>
      <footer><span>Siteproof</span><p>Code-first audits. AI only where it earns its keep.</p></footer>
    </main>
  </div>;
}

function IssueList({ issues }: { issues: Issue[] }) {
  return <div className="issueList">{issues.map((issue, index) => <article key={`${issue.title}-${index}`}><span className={`severity ${issue.severity.toLowerCase()}`}>{issue.severity}</span><div><h3>{issue.title}</h3><p>{issue.why}</p></div><details><summary>How to fix</summary><p>{issue.fix}</p></details></article>)}</div>;
}
