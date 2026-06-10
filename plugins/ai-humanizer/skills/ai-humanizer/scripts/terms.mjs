#!/usr/bin/env node
// Protected-term tooling for the ai-humanizer skill. Two jobs:
//
//   node terms.mjs extract <file>
//       Deterministic regex pass: pull the factual strings that MUST survive
//       verbatim — numbers, percentages, currency, years, [bracket] and
//       (author, 2024) citations, double-quoted passages. Prints a JSON array.
//       (Domain entities — drug names, theorems, standards, terms of art — are
//       NOT caught here; the agent adds those itself, see SKILL.md.)
//
//   node terms.mjs verify <orig-file> <new-file> <terms-json-file>
//       Guard rail. For every protected term present in the ORIGINAL, check it
//       still appears character-for-character in the REWRITE. Prints
//       { ok, total, missing:[...] }. A non-empty `missing` means the rewrite
//       dropped a key term and must be rolled back / redone for those terms.
//
// Ported from termsafe functions/_lib/extract.js (regex layer) +
// preservesAllTerms() (pipeline.js rollback check).

import { readFileSync } from "node:fs";

function extractFactualTerms(text) {
  const terms = new Set();
  if (!text) return [];
  const quoted = text.match(/[“”][^“”]{5,}[“”]|"[^"]{5,}"/g) || [];
  for (const q of quoted) terms.add(q);
  const brackets = text.match(/\[[^\]]{1,40}\]/g) || [];
  for (const b of brackets) terms.add(b.trim());
  const parens = text.match(/\(\s*[A-Z][A-Za-z'’.\-\s,&]{0,80}?\s*\d{4}[a-z]?\s*\)/g) || [];
  for (const p of parens) terms.add(p.trim());
  const numbers = text.match(/\b\d+(?:[.,]\d+)?(?:%|‰)?\b|\$\s?\d+(?:[.,]\d+)?(?:\s?(?:trillion|billion|million|thousand|k|M|B|T))?/gi) || [];
  for (const n of numbers) terms.add(n.trim());
  return [...terms].filter((t) => t.length >= 2).slice(0, 100);
}

function main() {
  const mode = process.argv[2];
  if (mode === "extract") {
    const text = readFileSync(process.argv[3] === "-" ? 0 : process.argv[3], "utf8");
    process.stdout.write(JSON.stringify(extractFactualTerms(text), null, 2) + "\n");
    return;
  }
  if (mode === "verify") {
    const orig = readFileSync(process.argv[3], "utf8");
    const next = readFileSync(process.argv[4], "utf8");
    const terms = JSON.parse(readFileSync(process.argv[5], "utf8"));
    const inOrig = terms.filter((t) => orig.includes(t));
    const missing = inOrig.filter((t) => !next.includes(t));
    process.stdout.write(JSON.stringify({
      ok: missing.length === 0,
      total: inOrig.length,
      missing,
    }, null, 2) + "\n");
    return;
  }
  console.error("usage:\n  node terms.mjs extract <file|->\n  node terms.mjs verify <orig> <new> <terms.json>");
  process.exit(2);
}

main();
