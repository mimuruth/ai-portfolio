/**
 * Build a PRINT-optimised PDF of the textbook with an author cover page.
 * Output: ai-engineering-textbook-print.pdf  (generated locally; not committed).
 *
 *   node build-print.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import hljs from "highlight.js";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CHAPTERS = join(__dirname, "chapters");
const OUT_PDF = join(__dirname, "ai-engineering-textbook-print.pdf");
const AUTHOR = "Michael Muruthi";

const mermaidSrc = readFileSync(require.resolve("mermaid/dist/mermaid.min.js"), "utf8");
const hljsCss = readFileSync(require.resolve("highlight.js/styles/github.css"), "utf8");
const bookCss = readFileSync(join(__dirname, "styles.css"), "utf8");

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

const markdown = readdirSync(CHAPTERS)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => readFileSync(join(CHAPTERS, f), "utf8"))
  .join("\n\n");

const tokens = md.parse(markdown, {});
const toc = [];
for (let i = 0; i < tokens.length; i++) {
  const t = tokens[i];
  if (t.type === "heading_open" && ["h1", "h2", "h3"].includes(t.tag)) {
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

// Print-specific overrides layered on top of the shared book stylesheet.
const printCss = `
  @page { size: A4; }
  .cover-print { height: 247mm; border-left: none; padding: 0; display: block; position: relative; }
  .cover-band { position: absolute; top: 0; left: 0; right: 0; height: 92mm; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #4f46e5 100%); }
  .cover-print .cover-inner { position: absolute; top: 26mm; left: 16mm; right: 16mm; color: #fff; }
  .cover-print .cover-kicker { color: #dbe4ff; letter-spacing: 0.2em; }
  .cover-print .cover-title { font-size: 38pt; line-height: 1.04; margin: 8mm 0 6mm 0; color: #fff; }
  .cover-print .cover-sub { color: #eaf0ff; font-size: 12pt; max-width: 165mm; }
  .cover-lower { position: absolute; top: 104mm; left: 16mm; right: 16mm; color: #1a1a1a; }
  .cover-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16mm; }
  .cover-tags span { font-family: "Segoe UI", Arial, sans-serif; font-size: 9pt; background: #eef2ff; color: #2563eb; border: 1px solid #c7d2fe; border-radius: 999px; padding: 3px 10px; }
  .cover-author-label { font-family: "Segoe UI", Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: #888; font-size: 9pt; }
  .cover-author { font-family: "Segoe UI", Arial, sans-serif; font-size: 22pt; font-weight: 700; color: #111; margin: 2mm 0 8mm 0; }
  .cover-edition { color: #555; font-style: italic; font-size: 10pt; }
  .copyright-page { page-break-before: always; padding-top: 60mm; color: #333; font-size: 10pt; }
  .copyright-page p { margin: 4px 0; }
  .copyright-page .cp-title { font-family: "Segoe UI", Arial, sans-serif; font-weight: 700; font-size: 12pt; color: #111; margin-bottom: 8mm; }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="author" content="${AUTHOR}">
<title>AI Engineering from Scratch to Shipped — ${AUTHOR}</title>
<style>${hljsCss}</style>
<style>${bookCss}</style>
<style>${printCss}</style>
</head>
<body>
<section class="cover cover-print">
  <div class="cover-band"></div>
  <div class="cover-inner">
    <div class="cover-kicker">A Practical Textbook &amp; Portfolio Guide</div>
    <h1 class="cover-title">AI Engineering<br>from Scratch to Shipped</h1>
    <div class="cover-sub">Retrieval-Augmented Generation · Observability · Offline Small Language Models ·
    Fine-Tuning (LoRA / QLoRA / DPO) · Real-Time Voice</div>
  </div>
  <div class="cover-lower">
    <div class="cover-tags"><span>prod-rag</span><span>local-slm-lab</span><span>llm-finetuning</span><span>realtime-voice</span></div>
    <div class="cover-author-label">Written by</div>
    <div class="cover-author">${AUTHOR}</div>
    <div class="cover-edition">First Edition · 2026 · Grounded in four working repositories with real, measured results.</div>
  </div>
</section>
<section class="copyright-page">
  <div class="cp-title">AI Engineering from Scratch to Shipped</div>
  <p>Copyright © 2026 ${AUTHOR}. All rights reserved.</p>
  <p>First Edition, 2026.</p>
  <p>Author: ${AUTHOR} &nbsp;·&nbsp; github.com/mimuruth</p>
  <p>&nbsp;</p>
  <p>Every result labelled <strong>MEASURED</strong> was produced on the reference hardware in
  Chapter 2. Results labelled <strong>EXAMPLE</strong> are illustrative, and those labelled
  <strong>REQUIRES YOU</strong> name the exact manual, credentialed, or GPU step needed to
  complete them. No fabricated benchmarks appear in this book.</p>
  <p>&nbsp;</p>
  <p>Produced from Markdown with a reproducible Node + Puppeteer pipeline. Diagrams rendered with
  Mermaid; charts rendered with Matplotlib from the projects' own result files.</p>
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

writeFileSync(join(__dirname, "book-print.html"), html);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(pathToFileURL(join(__dirname, "book-print.html")).href, { waitUntil: "networkidle0", timeout: 120000 });
await page.evaluate(async () => { await window.mermaid.run({ querySelector: ".mermaid" }); });
await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#aaa;width:100%;padding:0 16mm;text-align:right;">AI Engineering from Scratch to Shipped</div>`,
  footerTemplate: `<div style="font-size:8px;color:#aaa;width:100%;padding:0 16mm;display:flex;justify-content:space-between;"><span>${AUTHOR}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log("wrote", OUT_PDF);
