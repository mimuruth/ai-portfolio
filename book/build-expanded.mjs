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
const OUT_PDF = join(__dirname, "ai-engineering-textbook-expanded.pdf");

const mermaidSrc = readFileSync(require.resolve("mermaid/dist/mermaid.min.js"), "utf8");
const hljsCss = readFileSync(require.resolve("highlight.js/styles/github.css"), "utf8");
const bookCss = readFileSync(join(__dirname, "styles.css"), "utf8");

// KaTeX CSS with font URLs rewritten to absolute file URLs so Chromium resolves them.
const katexCssPath = require.resolve("katex/dist/katex.min.css");
const fontsUrl = pathToFileURL(join(dirname(katexCssPath), "fonts")).href;
const katexCss = readFileSync(katexCssPath, "utf8").replace(/url\(fonts\//g, `url(${fontsUrl}/`);

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
for (const b of ["back-1-glossary.md", "back-2-hardware.md", "back-4-cheatsheet.md", "back-3-index.md"]) {
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

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AI Engineering from Scratch to Shipped — Expanded Edition</title>
<style>${hljsCss}</style>
<style>${katexCss}</style>
<style>${bookCss}</style>
<style>${expCss}</style>
</head>
<body>
<section class="cover">
  <div class="cover-kicker">A Practical Textbook &amp; Portfolio Guide · Expanded Edition</div>
  <h1 class="cover-title">AI Engineering<br>from Scratch to Shipped</h1>
  <div class="cover-sub">Five production projects: Retrieval-Augmented Generation, Observability,
  Offline Small Language Models, Fine-Tuning (LoRA/QLoRA/DPO), and Real-Time Voice</div>
  <div class="cover-meta">Expanded with first-principles math, bare-metal code, hands-on labs,
  exercises, a glossary, and a hardware reference.</div>
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
