/**
 * Build the EXPANDED edition: same chapter content as the standard book, plus
 * front matter (prerequisites, repo, three-tier philosophy), per-chapter
 * Learning Objectives + Engineering Labs (math, bare-metal code, production
 * notes, exercises), and back matter (glossary, hardware reference, index).
 * LaTeX is rendered with KaTeX. Output: ai-engineering-textbook-expanded.pdf
 * (generated locally; not committed).
 *
 *   node build-expanded.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import texmath from "markdown-it-texmath";
import katex from "katex";
import hljs from "highlight.js";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CHAPTERS = join(__dirname, "chapters");
const EXP = join(__dirname, "expanded");
const WITH_SOLUTIONS = process.env.WITH_SOLUTIONS === "1";
const OUT_PDF = join(
  __dirname,
  WITH_SOLUTIONS ? "ai-engineering-textbook-expanded-solutions.pdf" : "ai-engineering-textbook-expanded.pdf",
);

const mermaidSrc = readFileSync(require.resolve("mermaid/dist/mermaid.min.js"), "utf8");
const hljsCss = readFileSync(require.resolve("highlight.js/styles/github.css"), "utf8");
const bookCss = readFileSync(join(__dirname, "styles.css"), "utf8");

// KaTeX CSS with font URLs rewritten to absolute file URLs so Chromium resolves them.
const katexCssPath = require.resolve("katex/dist/katex.min.css");
const fontsUrl = pathToFileURL(join(dirname(katexCssPath), "fonts")).href;
const katexCss = readFileSync(katexCssPath, "utf8").replace(/url\(fonts\//g, `url(${fontsUrl}/`);

const AUTHOR = "Michael Muruthi";

// Generative cover artwork (identical to the illustrated edition).
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildArtworkSvg() {
  const rand = mulberry32(20260805);
  const W = 1000;
  const H = 660;
  const nodes = [];
  nodes.push({ x: 500, y: 320, r: 10, hub: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    nodes.push({ x: 500 + Math.cos(a) * 135, y: 320 + Math.sin(a) * 108, r: 4 + rand() * 3 });
  }
  for (let i = 0; i < 46; i++) {
    nodes.push({ x: 50 + rand() * 900, y: 40 + rand() * 580, r: 2.4 + rand() * 4.2 });
  }
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const edges = new Set();
  nodes.forEach((n, i) => {
    nodes
      .map((m, j) => ({ j, dd: d(n, m) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.dd - b.dd)
      .slice(0, 2)
      .forEach((o) => edges.add(i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`));
  });
  nodes.forEach((n, i) => {
    if (i !== 0 && d(n, nodes[0]) < 300 && rand() > 0.4) edges.add(`0-${i}`);
  });
  const edgeSvg = [...edges]
    .map((k) => {
      const [i, j] = k.split("-").map(Number);
      const op = (0.14 + rand() * 0.22).toFixed(2);
      return `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" stroke="#8ec2ff" stroke-opacity="${op}" stroke-width="1"/>`;
    })
    .join("");
  const nodeSvg = nodes
    .map((n) => {
      if (n.hub) {
        return `<circle cx="${n.x}" cy="${n.y}" r="26" fill="#a5b4fc" opacity="0.35" filter="url(#soft)"/>
                <circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="#ffffff"/>`;
      }
      const bright = rand() > 0.78;
      const glow = bright ? `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(n.r * 3).toFixed(1)}" fill="#67e8f9" opacity="0.28" filter="url(#soft)"/>` : "";
      return `${glow}<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="url(#node)"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#080d1c"/>
        <stop offset="0.5" stop-color="#13245a"/>
        <stop offset="1" stop-color="#3a2f7d"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.48" r="0.55">
        <stop offset="0" stop-color="#3b82f6" stop-opacity="0.55"/>
        <stop offset="0.55" stop-color="#4f46e5" stop-opacity="0.20"/>
        <stop offset="1" stop-color="#4f46e5" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="node" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stop-color="#a7f3ff"/>
        <stop offset="0.55" stop-color="#67e8f9"/>
        <stop offset="1" stop-color="#6366f1"/>
      </radialGradient>
      <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <circle cx="500" cy="320" r="420" fill="url(#glow)"/>
    <circle cx="500" cy="320" r="165" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="1"/>
    <circle cx="500" cy="320" r="235" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>
    <g stroke-linecap="round">${edgeSvg}</g>
    <g>${nodeSvg}</g>
  </svg>`;
}
const artworkSvg = buildArtworkSvg();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang === "mermaid") return `<pre class="mermaid">${md.utils.escapeHtml(code)}</pre>`;
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`;
      } catch {
        /* fall through */
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
  },
});
md.use(anchor, { slugify: (s) => s.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "") });
md.use(texmath, { engine: katex, delimiters: "kramdown", katexOptions: { throwOnError: false } });

// Assemble: front matter -> chapters (LO injected after H1, lab appended) -> back matter.
const parts = [readFileSync(join(EXP, "frontmatter.md"), "utf8")];
for (const f of readdirSync(CHAPTERS).filter((x) => x.endsWith(".md")).sort()) {
  const num = f.slice(0, 2);
  let content = readFileSync(join(CHAPTERS, f), "utf8");
  const supp = join(EXP, `ch-${num}.md`);
  let lo = "";
  let aug = "";
  if (existsSync(supp)) {
    const [a, b] = readFileSync(supp, "utf8").split("<!--SPLIT-->");
    lo = (a || "").trim();
    aug = (b || "").trim();
  }
  if (lo) {
    const lines = content.split("\n");
    const h1 = lines.findIndex((l) => /^# /.test(l));
    if (h1 >= 0) lines.splice(h1 + 1, 0, "\n" + lo + "\n");
    else lines.unshift(lo + "\n");
    content = lines.join("\n");
  }
  parts.push(aug ? content + "\n\n" + aug : content);
}
const backMatter = ["back-1-glossary.md", "back-2-hardware.md", "back-4-cheatsheet.md", "back-3-index.md"];
if (WITH_SOLUTIONS) backMatter.unshift("solutions.md"); // between Chapter 13 and the Glossary
for (const b of backMatter) {
  parts.push(readFileSync(join(EXP, b), "utf8"));
}
const markdown = parts.join("\n\n");

const tokens = md.parse(markdown, {});
const toc = [];
for (let i = 0; i < tokens.length; i++) {
  const t = tokens[i];
  if (t.type === "heading_open" && ["h1", "h2"].includes(t.tag)) {
    const text = tokens[i + 1].children
      .filter((c) => c.type === "text" || c.type === "code_inline")
      .map((c) => c.content)
      .join("");
    toc.push({ level: Number(t.tag[1]), text, id: t.attrGet("id") });
  }
}
const tocHtml = toc
  .map((h) => `<div class="toc-item toc-l${h.level}"><a href="#${h.id}">${md.utils.escapeHtml(h.text)}</a></div>`)
  .join("\n");

const body = md.render(markdown);

const expCss = `
  .lab { border: 1px solid #c7d2fe; background: #f7f9ff; border-radius: 6px; padding: 2px 12px; margin: 12px 0; }
  .prodnote { border-left: 4px solid #f59e0b; background: #fff7ed; padding: 8px 14px; margin: 12px 0; }
  .prodnote p { margin: 4px 0; }
  .katex { font-size: 1.02em; }
  .katex-display { margin: 10px 0; overflow-x: auto; overflow-y: hidden; }
`;

const artCss = `
  .cover-art { height: 247mm; padding: 0; border-left: none; display: block; position: relative; overflow: hidden; }
  .art-hero { position: absolute; top: 0; left: 0; right: 0; height: 146mm; background: #0a0f1e; }
  .art-hero svg { width: 100%; height: 100%; display: block; }
  .art-rule { position: absolute; top: 146mm; left: 0; right: 0; height: 2mm; background: linear-gradient(90deg, #67e8f9 0%, #2563eb 45%, #6366f1 100%); }
  .art-text { position: absolute; top: 156mm; left: 15mm; right: 15mm; }
  .art-kicker { font-family: "Segoe UI", Arial, sans-serif; letter-spacing: 0.20em; text-transform: uppercase; color: #2563eb; font-size: 9.5pt; font-weight: 600; }
  .art-title { font-family: "Segoe UI", Arial, sans-serif; font-weight: 800; font-size: 34pt; line-height: 1.02; margin: 5mm 0 4mm 0; border: none; padding: 0; color: #0b1020; }
  .art-title .l2 { color: #2563eb; }
  .art-sub { color: #555; font-size: 11pt; max-width: 170mm; margin: 0 0 6mm 0; }
  .art-author-label { font-family: "Segoe UI", Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: #8a8f98; font-size: 8.5pt; }
  .art-author { font-family: "Segoe UI", Arial, sans-serif; font-weight: 800; font-size: 20pt; color: #0b1020; margin: 1.5mm 0 4mm 0; }
  .art-edition { color: #555; font-style: italic; font-size: 9.5pt; max-width: 170mm; }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AI Engineering from Scratch to Shipped — Expanded Edition</title>
<style>${hljsCss}</style>
<style>${katexCss}</style>
<style>${bookCss}</style>
<style>${expCss}</style>
<style>${artCss}</style>
</head>
<body>
<section class="cover cover-art">
  <div class="art-hero">${artworkSvg}</div>
  <div class="art-rule"></div>
  <div class="art-text">
    <div class="art-kicker">A Practical Textbook &amp; Portfolio Guide · Expanded Edition</div>
    <h1 class="art-title">AI Engineering<br><span class="l2">from Scratch to Shipped</span></h1>
    <div class="art-sub">Retrieval-Augmented Generation · Observability · Offline Small Language Models ·
    Fine-Tuning (LoRA / QLoRA / DPO) · Real-Time Voice</div>
    <div class="art-author-label">Written by</div>
    <div class="art-author">${AUTHOR}</div>
    <div class="art-edition">${WITH_SOLUTIONS ? "Expanded Edition with Solutions" : "Expanded Edition"} · 2026 · First-principles math, bare-metal code, hands-on labs, and a hardware reference.</div>
  </div>
</section>
<section class="toc-page">
  <h1 class="toc-h">Contents</h1>
  ${tocHtml}
</section>
<main class="book">
${body}
</main>
<script>${mermaidSrc}</script>
<script>window.mermaid.initialize({ startOnLoad: false, theme: "neutral", flowchart: { htmlLabels: true } });</script>
</body>
</html>`;

writeFileSync(join(__dirname, "book-expanded.html"), html);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(pathToFileURL(join(__dirname, "book-expanded.html")).href, { waitUntil: "networkidle0", timeout: 120000 });
await page.evaluate(async () => { await window.mermaid.run({ querySelector: ".mermaid" }); });
await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#999;width:100%;padding:0 16mm;text-align:right;">AI Engineering from Scratch to Shipped — Expanded Edition</div>`,
  footerTemplate: `<div style="font-size:8px;color:#999;width:100%;padding:0 16mm;display:flex;justify-content:space-between;"><span>github.com/mimuruth</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log("wrote", OUT_PDF);
