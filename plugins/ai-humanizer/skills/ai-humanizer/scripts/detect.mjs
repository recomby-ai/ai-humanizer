#!/usr/bin/env node
// Standalone ZeroGPT detector — the objective baseline signal for the
// ai-humanizer skill. No API key, no auth: ZeroGPT's public endpoint is
// keyless. Ported from termsafe's functions/_lib/zgpt.js, stripped of the
// Cloudflare Worker assumptions so it runs under plain Node 18+.
//
// Usage:
//   node detect.mjs <file>            # detect a text/markdown file
//   node detect.mjs -                 # read text from stdin
//   echo "..." | node detect.mjs -
//
// Output (JSON on stdout):
//   { "fake": 87.3,                   // AI percentage (0-100), the headline number
//     "aiWords": 142, "textWords": 198,
//     "flagged": ["sentence ...", ...],   // sentences the detector marks AI (attack these)
//     "chunks": 1 }
//
// The detector picks WHICH sentences to rewrite. The rest of the loop only
// touches `flagged`; everything else stays byte-for-byte. That is the whole
// point of detector-guided paraphrase (arxiv 2506.07001): surgical, not blanket.

import { readFileSync } from "node:fs";

const ZGPT_MAX_CHARS = 14000; // ZeroGPT silently truncates beyond ~14k chars.

const PRESETS = [
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", chua: '"Google Chrome";v="126", "Chromium";v="126", "Not.A/Brand";v="24"', plat: '"Windows"' },
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", chua: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"', plat: '"Windows"' },
  { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36", chua: '"Google Chrome";v="126", "Chromium";v="126", "Not.A/Brand";v="24"', plat: '"macOS"' },
  { ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", chua: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"', plat: '"Linux"' },
];

function pick() { return PRESETS[Math.floor(Math.random() * PRESETS.length)]; }

// Split into sentence-ish units, then pack into <ZGPT_MAX_CHARS blocks so a
// long document is detected in pieces and the scores aggregated. A 500-word
// essay is one chunk; this only matters for the long inputs the skill unlocks.
function chunk(text) {
  if (text.length <= ZGPT_MAX_CHARS) return [text];
  const sents = text.split(/(?<=[.!?])\s+(?=[A-Z"'(\[])/g);
  const blocks = [];
  let cur = "";
  for (const s of sents) {
    if (cur.length + s.length + 1 > ZGPT_MAX_CHARS && cur) { blocks.push(cur); cur = ""; }
    cur += (cur ? " " : "") + s;
  }
  if (cur) blocks.push(cur);
  return blocks;
}

async function detectBlock(inputText) {
  const p = pick();
  const headers = {
    "sec-ch-ua": p.chua,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": p.plat,
    "user-agent": p.ua,
    accept: "*/*",
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    referer: "https://www.zerogpt.com/",
    origin: "https://www.zerogpt.com",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
  };
  const r = await fetch("https://api.zerogpt.com/api/detect/detectText", {
    method: "POST",
    headers,
    body: JSON.stringify({ input_text: inputText }),
  });
  if (r.status !== 200) throw new Error(`ZeroGPT HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  if (!j?.success) throw new Error(`ZeroGPT success=false: ${JSON.stringify(j).slice(0, 200)}`);
  return {
    fake: j.data.fakePercentage ?? 0,
    aiWords: j.data.aiWords ?? 0,
    textWords: j.data.textWords ?? 0,
    flagged: [...(j.data.h || []), ...(j.data.hi || [])],
  };
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: node detect.mjs <file|->");
    process.exit(2);
  }
  const text = (arg === "-" ? readFileSync(0, "utf8") : readFileSync(arg, "utf8")).trim();
  if (!text) { console.error("empty input"); process.exit(2); }

  const blocks = chunk(text);
  const results = [];
  for (let i = 0; i < blocks.length; i++) {
    // Throttle multi-chunk runs so we don't burn the shared ZeroGPT IP.
    if (i > 0) await new Promise((res) => setTimeout(res, 1500 + Math.random() * 2000));
    results.push(await detectBlock(blocks[i]));
  }

  const textWords = results.reduce((a, r) => a + r.textWords, 0) || 1;
  const aiWords = results.reduce((a, r) => a + r.aiWords, 0);
  // Weight each chunk's percentage by its word count for the aggregate.
  const fake = results.reduce((a, r) => a + r.fake * r.textWords, 0) / textWords;
  const flagged = [...new Set(results.flatMap((r) => r.flagged).map((s) => s.trim()).filter(Boolean))];

  process.stdout.write(JSON.stringify({
    fake: Math.round(fake * 10) / 10,
    aiWords,
    textWords,
    flagged,
    chunks: blocks.length,
  }, null, 2) + "\n");
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
