# ai-humanizer

A Claude Code skill that **lowers the AI-detection score of English text without changing what it says** — every key term, number, and citation is preserved verbatim, and the original logic stays intact.

It works by *detector-guided surgical paraphrase* (cf. [arXiv:2506.07001](https://arxiv.org/abs/2506.07001)): a detector flags which sentences read as AI, the agent rewrites only those, re-checks, and loops — keeping the best result and never dropping a protected term.

- **No API key.** The baseline detector is the keyless ZeroGPT endpoint; the **agent running the skill is the rewriter**, so there is no separate paraphrase API to configure.
- **Term-safe.** Numbers, percentages, citations, drug/gene names, theorems, standards, and inline notation are extracted and verified character-for-character after every round.
- **Honest.** Real human academic prose scores 0–50% on these detectors, not 0. Saturated topics (clinical, monetary policy, common legal/historical essays) are reported truthfully instead of over-promised. ZeroGPT is treated as a free *proxy* — Turnitin is the ground truth.
- **Reads detector reports.** Hand it a Turnitin / GPTZero / Originality.ai PDF and it uses the report's highlighted spans as the attack list.

> ⚠️ For legitimate use — reducing false positives on your own writing, de-roboticizing AI-assisted drafts, and detector research. Follow your institution's and publisher's policies on AI assistance.

## Install

```
/plugin marketplace add recomby-ai/ai-humanizer
/plugin install ai-humanizer@ai-humanizer
```

Update later with:

```
/plugin marketplace update ai-humanizer
```

<details>
<summary>Manual install (other agents — Codex, Cursor, Gemini CLI)</summary>

The skill is plain Node with no dependencies. Clone the repo (or copy the skill folder) and point your agent at `SKILL.md`:

```bash
git clone https://github.com/recomby-ai/ai-humanizer
# the skill lives at:
#   ai-humanizer/plugins/ai-humanizer/skills/ai-humanizer/
```

Then tell the agent to read `SKILL.md` and follow it. The two scripts run under any Node 18+:

```bash
node scripts/detect.mjs <file>            # AI score + flagged sentences (JSON)
node scripts/terms.mjs extract <file>     # protected factual terms
node scripts/terms.mjs verify <orig> <new> <terms.json>   # term-preservation gate
```
</details>

## How to use it

Trigger phrases (English or Chinese): *"humanize this", "lower the AI score", "降AI率", "降低Turnitin AI率", "make this read human", "reduce GPTZero score"* — or just hand over a draft, optionally with a detector report PDF.

The skill will:

1. Detect a **baseline** score and the flagged sentences.
2. Build the **protected-term** list (deterministic regex + the agent's own domain-entity pass).
3. Rewrite **only the flagged sentences** under a set of surgical rules grounded in measured findings (see `reference/principles.md`).
4. Re-detect and loop (up to ~5 rounds), keeping the best version.
5. **Verify** every protected term survived, then show a **before → after** report with a sentence-level diff.

## Why these rules (the short version)

The detailed evidence is in [`reference/principles.md`](plugins/ai-humanizer/skills/ai-humanizer/reference/principles.md). The headline findings, measured against ZeroGPT with confirmed-human baselines:

- **The signal is lexical predictability, not connectives.** "Furthermore / Moreover / plays a crucial role" is a false tell — a Band-9 IELTS sample full of them scored 19.6%; a polished AI clinical review with none scored 100%.
- **Fluency is the tell.** Polished, frictionless prose reads as AI. You lower the score by allowing *slight roughness* and longer, idea-dense sentences — not by chopping text into short punchy lines.
- **For academic content, more precision — not more casual.** Swap high-probability defaults for precise, lower-frequency domain vocabulary. "Explain it to a friend" is the wrong move here.
- **Best-of-N is the biggest lever.** Score variance is sampling-dominated (the same input can swing 0–52%). Generate a few independent rewrites and keep the lowest scorer.

## License

[MIT](LICENSE) © recomby-ai
