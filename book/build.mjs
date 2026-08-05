/**
 * Build the AI Engineering textbook PDF from the Markdown chapters in ./chapters.
 *
 *   npm install && npm run build
 *
 * Pipeline: concatenate chapters -> markdown-it (HTML) with highlight.js code
 * highlighting and Mermaid diagram blocks -> Puppeteer (headless Chromium)
 * renders Mermaid, then prints to a paginated PDF with a cover, TOC, and page
 * numbers.
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
const OUT_PDF = join(__dirname, "ai-engineering-textbook.pdf");

const mermaidSrc = readFileSync(require.resolve("mermaid/dist/mermaid.min.js"), "utf8");
const hljsCss = readFileSync(require.resolve("highlight.js/styles/github.css"), "utf8");
const bookCss = readFileSync(join(__dirname, "styles.css"), "utf8");

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang === "mermaid") {
      return `<pre class="mermaid">${md.utils.escapeHtml(code)}</pre>`;
    }
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

const chapterFiles = readdirSync(CHAPTERS)
  .filter((f) => f.endsWith(".md"))
  .sort();
const markdown = chapterFiles.map((f) => readFileSync(join(CHAPTERS, f), "utf8")).join("\n\n");

// Build a table of contents from H1/H2/H3 headings.
const tokens = md.parse(markdown, {});
const toc = [];
for (let i = 0; i < tokens.length; i++) {
  const t = tokens[i];
  if (t.type === "heading_open" && ["h1", "h2", "h3"].includes(t.tag)) {
    const inline = tokens[i + 1];
    const text = inline.children.filter((c) => c.type === "text" || c.type === "code_inline").map((c) => c.content).join("");
    const id = t.attrGet("id");
    toc.push({ level: Number(t.tag[1]), text, id });
  }
}
const tocHtml = toc
  .map((h) => `<div class="toc-item toc-l${h.level}"><a href="#${h.id}">${md.utils.escapeHtml(h.text)}</a></div>`)
  .join("\n");

const body = md.render(markdown);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>${hljsCss}</style>
<style>${bookCss}</style>
</head>
<body>
<section class="cover">
  <div class="cover-kicker">A Practical Textbook &amp; Portfolio Guide</div>
  <h1 class="cover-title">AI Engineering<br>from Scratch to Shipped</h1>
  <div class="cover-sub">Five production projects: Retrieval-Augmented Generation, Observability,
  Offline Small Language Models, Fine-Tuning (LoRA/QLoRA/DPO), and Real-Time Voice</div>
  <div class="cover-meta">Grounded in four working repositories with real, measured results.</div>
</section>
<section class="toc-page">
  <h1 class="toc-h">Contents</h1>
  ${tocHtml}
</section>
<main class="book">
${body}
</main>
<script>${mermaidSrc}</script>
<script>
  window.mermaid.initialize({ startOnLoad: false, theme: "neutral", flowchart: { htmlLabels: true } });
</script>
</body>
</html>`;

writeFileSync(join(__dirname, "book.html"), html);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(pathToFileURL(join(__dirname, "book.html")).href, { waitUntil: "networkidle0", timeout: 120000 });
// Render Mermaid diagrams deterministically before printing.
await page.evaluate(async () => {
  await window.mermaid.run({ querySelector: ".mermaid" });
});
await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#999;width:100%;padding:0 16mm;text-align:right;">AI Engineering from Scratch to Shipped</div>`,
  footerTemplate: `<div style="font-size:8px;color:#999;width:100%;padding:0 16mm;display:flex;justify-content:space-between;"><span>github.com/mimuruth</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log("wrote", OUT_PDF);
