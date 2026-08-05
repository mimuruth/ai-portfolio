/**
 * Build the expanded edition WITH a Solutions appendix (answers to every
 * Review & Exercises), placed between Chapter 13 and the Glossary.
 * Output: ai-engineering-textbook-expanded-solutions.pdf (local; not committed).
 *
 *   node build-solutions.mjs
 *
 * This simply sets a flag and delegates to build-expanded.mjs, so the standard
 * expanded edition (without solutions) is unaffected.
 */
process.env.WITH_SOLUTIONS = "1";
await import("./build-expanded.mjs");
