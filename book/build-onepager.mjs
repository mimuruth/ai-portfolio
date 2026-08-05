/**
 * Build the one-page executive summary PDF from onepager.md.
 *   node build-onepager.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PDF = join(__dirname, "ai-engineering-onepager.pdf");

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const body = md.render(readFileSync(join(__dirname, "onepager.md"), "utf8"));

const css = `
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1a1a1a; font-size: 8.4pt; line-height: 1.4; margin: 0; }
  h1 { font-size: 17pt; margin: 0 0 2px 0; border-bottom: 3px solid #2563eb; padding-bottom: 3px; }
  h1 + p { color: #555; margin: 3px 0 8px 0; }
  h2 { font-size: 11pt; margin: 10px 0 4px 0; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  p { margin: 4px 0; }
  ul { margin: 4px 0; padding-left: 16px; }
  li { margin: 2px 0; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 7.6pt; }
  th, td { border: 1px solid #ddd; padding: 3px 5px; vertical-align: top; text-align: left; }
  th { background: #eef2ff; }
  code { background: #f6f8fa; padding: 0 3px; border-radius: 3px; font-size: 7.6pt; }
  a { color: #2563eb; text-decoration: none; }
  strong { color: #111; }
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
writeFileSync(join(__dirname, "onepager.html"), html);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(pathToFileURL(join(__dirname, "onepager.html")).href, { waitUntil: "networkidle0" });
await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", bottom: "10mm", left: "12mm", right: "12mm" },
});
await browser.close();
console.log("wrote", OUT_PDF);
