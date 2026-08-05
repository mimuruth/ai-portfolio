# AI Engineering Textbook

Source for **`ai-engineering-textbook.pdf`** — a ~70-page, textbook-style guide
that teaches, documents, and connects the four portfolio repositories
(`prod-rag`, `local-slm-lab`, `llm-finetuning`, `realtime-voice`).

It serves three purposes: a technical textbook, a reproducible implementation
guide, and an interview-preparation guide. Every number is labelled **MEASURED**,
**EXAMPLE**, or **REQUIRES YOU** — no fabricated benchmarks.

## Structure

```
book/
  chapters/        # the source, one Markdown file per chapter (edit these)
  assets/          # charts copied from the projects' docs/ folders
  styles.css       # print/textbook styling
  build.mjs        # Markdown -> HTML (markdown-it + highlight.js + Mermaid) -> PDF (Puppeteer)
  ai-engineering-textbook.pdf   # the built deliverable
```
## Rebuild the PDF

Requires Node.js.

```bash
cd book
npm install
npx puppeteer browsers install chrome   # if npm blocked the postinstall
npm run build                            # -> ai-engineering-textbook.pdf
node build-onepager.mjs                   # -> ai-engineering-onepager.pdf + .png (1-page executive summary)
```
The charts in `assets/` are regenerated from the projects' own result files:

```bash
python ../local-slm-lab/scripts/plot_results.py     # -> ../local-slm-lab/docs/benchmark.png
python ../realtime-voice/scripts/plot_results.py    # -> ../realtime-voice/docs/latency-budget.png
python ../prod-rag/scripts/plot_results.py          # -> ../prod-rag/docs/prod-rag-results.png
# then copy the three PNGs into book/assets/ and re-run npm run build
```

## Editing

Edit the Markdown in `chapters/`. Files are concatenated in filename order, so the
numeric prefixes (`00-…`, `01-…`) set the sequence. The table of contents and page
numbers are generated automatically at build time.
