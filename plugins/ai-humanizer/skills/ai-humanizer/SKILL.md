---
name: ai-humanizer
description: >-
  Lower the AI-detection score of English text (essays, papers, reports) while
  preserving every key term, number, citation, and the original logic. Uses a
  keyless ZeroGPT script as the objective baseline and the running agent itself
  as the rewriter — no API key. Reads Turnitin/GPTZero PDF reports for
  ground-truth scores. Use when the user wants to "降AI率 / 降低AI率 / 去AI味 /
  humanize AI text / bypass AI detector / lower Turnitin AI score / make this
  read human / reduce GPTZero score", or hands over a draft plus a detector
  report and asks to bring the AI percentage down without changing the meaning.
---

# ai-humanizer

Reduce the AI-detection score of English text **without** changing what it says.
This is detector-guided surgical paraphrase: a detector tells you *which*
sentences read as AI, you rewrite only those, you re-check, you loop. Everything
not flagged stays byte-for-byte. Every protected term survives verbatim.

This skill is self-contained Node (no API key, no install): the detector is the
keyless ZeroGPT endpoint, and **the agent running this skill is the rewriter** —
you replace what used to be a separate paraphrase API.

## The one idea that makes this work

AI detectors do **not** key on "Furthermore / Moreover / plays a crucial role".
That folklore is wrong and was disproven on real data (a Band-9 IELTS sample full
of "Firstly/Furthermore/Consequently" scored 19.6%; a polished clinical review
with none of them scored 100%). The real signal is **lexical predictability** —
how default, high-probability, and *smooth* each next word is. **Fluency is the
tell.** Polished, frictionless prose is what reads as AI.

So you lower the score by making flagged sentences **less predictable and less
smooth** while keeping them correct and meaning-identical:

- Replace the highest-probability wording with **precise, lower-frequency**
  alternatives an expert in the field would actually reach for.
- Prefer **longer, idea-dense sentences** with stacked subordinate clauses. Do
  **not** chop everything into short punchy sentences — that is its own AI tell.
- Allow **slight roughness**: passive voice, a parenthetical wedged mid-clause,
  a clunky author-first opener. Real human writing under deadline is not perfectly
  smooth. (See `reference/principles.md` for the evidence behind every claim here.)

For academic content the path to a low score is **more precision, not more
casual**. Do not "explain it to a friend." That is the opposite of what works.

## Workflow

Work on a file. Keep the original untouched; write iterations to new files so you
can roll back and so the before/after diff is exact.

`SKILL_DIR` below = the directory containing this file.

### 0. Gather inputs
- The draft (a `.txt`/`.md` file, or save the user's pasted text to one).
- **Optional — a detector report PDF** (Turnitin, GPTZero, Originality.ai). If
  given, **read it natively** and extract: (a) the real AI %, (b) the exact
  sentences/spans it highlights. Those highlights override ZeroGPT's — Turnitin
  is the ground truth; ZeroGPT is only a free proxy. See "Reading reports" below.
- **Optional — user-supplied protected terms.** Add to the protected list as-is.

### 1. Build the protected-term list
Two layers, union them:
1. `node SKILL_DIR/scripts/terms.mjs extract <draft>` → numbers, %, currency,
   years, `[refs]`, `(Author, 2024)` citations, quoted passages. Deterministic.
2. **You** scan the draft for **domain entities** the regex can't catch — named
   methods/theorems/laws, standards (ISO 9001, RFC 7231), drugs/genes/species,
   org/product/dataset names, units & inline notation (kPa, O(n log n), p<0.05),
   and terms of art whose meaning is fixed by the field. The test is **not**
   "could this be paraphrased" — it is "would a casual paraphrase lose
   field-specific meaning?". `p-value` passes; `team performance` does not. When
   unsure, exclude — over-protecting freezes the sentence and blocks the rewrite.

### 2. Baseline detect
`node SKILL_DIR/scripts/detect.mjs <draft>` → `{ fake, flagged:[...] }`.
Record `fake` as the **before** score. `flagged` is your attack list. If a
Turnitin PDF was provided, use its highlighted sentences as the attack list
instead (or in addition).

### 3. Rewrite ONLY the flagged sentences (you are the rewriter)
For each flagged sentence, produce one replacement following **the surgical
rules** (next section). Do not touch unflagged sentences. Do not change paragraph
structure, headings, or list markers. Apply each replacement by locating the
exact original substring and swapping it — surrounding markdown stays intact.

### 4. Re-detect and loop
Run `detect.mjs` on the rewrite. Then:
- If `fake` < **target**, stop (success). Default target **20**; but see
  "Calibration" — for academic prose, matching the human 0–50% band is the real
  goal, and < 20 is not always reachable or necessary.
- If it dropped but is still above target, take the new `flagged` list and loop
  (step 3). **Keep the best-scoring version across rounds** — a later round can
  over-rewrite and regress; never return something worse than a previous round.
- Cap at **~5 rounds**. If two consecutive rounds don't improve, stop and report
  honestly (see "Known limits" — some topics are detector-saturated).
- A sentence still flagged after a round: on the retry, tell yourself explicitly
  *"the previous rewrite of this sentence was still flagged — go further, change
  the structure not just a word."* Escalate aggressiveness across rounds.

### 5. Verify term preservation (hard gate)
`node SKILL_DIR/scripts/terms.mjs verify <orig-draft> <final> <terms.json>`
(pass the union list from step 1 as a JSON file). If `missing` is non-empty, the
rewrite dropped a protected term — **redo those specific sentences** keeping the
term character-for-character. Do not ship with a non-empty `missing`.

### 6. Report
Show the user a compact before/after:
- **AI score: before% → after%** (and the Turnitin number if available).
- **Term preservation: N/N kept** (from step 5).
- A short **diff** of what changed — original vs rewritten for each flagged
  sentence, so they can see meaning was preserved. Keep unchanged text out of it.

## Surgical rewrite rules

Apply liberally to flagged sentences. A timid rewrite leaves the signal in place.

**DO**
- **Restructure the opener**: lead with a subordinate clause, an adverbial, the
  named author, or the object — not the topic noun. Passive voice is fine here.
- **Merge** related sentences into longer idea-dense ones; **split** only when a
  sentence truly holds two unrelated ideas. Bias toward longer, not shorter.
- **Substitute non-protected vocabulary** for precise, lower-frequency words a
  domain expert would use ("yields outcomes" → "produced larger effect sizes").
- **Cut empty scaffolding**: "in order to" → "to"; "It is important to note
  that" → state the claim; "as can be seen" → drop.
- **Vary openers** across a set — three sentences starting "The/This/It" must
  become three different structures.
- **Allow slight awkwardness.** Smoothness is the AI tell.

**PHRASE BAN — cut every instance (these are the high-yield AI tells)**
- "stands as a testament" / "plays a crucial/vital/pivotal role" / "in today's
  [adj] landscape" / "in the realm of" / "marks a pivotal moment".
- "serves as" / "stands as" / "boasts" / "features" → "is" / "has".
- "It is important/worth noting that" / "It should be noted that" → delete, assert.
- Trailing **-ing fake-depth clauses**: "..., highlighting X." / "..., reflecting
  Y." / "..., underscoring Z." — cut or fold into the main clause.
- High-frequency AI words: *delve, foster, leverage, navigate, facilitate,
  underscore, showcase, harness, unveil, embark, encompass, intricate,
  multifaceted, robust (non-statistical), comprehensive, holistic, seamless,
  pivotal, paradigm, synergy, transformative, groundbreaking, vibrant, profound,
  remarkable, compelling, noteworthy, unprecedented, realm, myriad, plethora,
  tapestry, testament, interplay.*
- Stacked transitions: at most ONE of {Moreover/Furthermore/Additionally/
  Therefore/Thus/Hence/Consequently} per rewritten set — but do not fear formal
  connectives themselves; one is fine, a pile is the tell.
- "Not only X, but Y" / rhetorical questions to the reader / "the future looks bright".

**HARD CONSTRAINTS (non-negotiable)**
- Every protected term that was in the original sentence appears **verbatim** in
  your rewrite. No synonyms, no inflections, no deletion.
- Add **no** claim, statistic, methodology detail, qualifier, or framing not in
  the source. Lowering the score must never invent content.
- Do not switch register to blog/casual ("the takeaway", "Honestly,", "Look,",
  contractions) — that fails academic register and trades one tell for another.

**DO NOT** (these were tried and backfired — see principles.md):
- Don't paste "human writing samples" as style anchors — the model mimics their
  surface instead of attacking the signal (cost 23 points in testing).
- Don't add a long numbered rulebook — too many rules paralyze the rewrite into
  near-identical copies. Keep the active instruction set tight.

## Reading detector reports (PDF)

When the user provides a Turnitin / GPTZero / Originality.ai PDF:
1. Read it natively. Pull the **headline AI %** and every **highlighted span**.
2. Use the highlighted spans as the attack list in step 3 (they are
   ground-truth flags, better than ZeroGPT's proxy flags).
3. After rewriting, you usually **cannot** re-run Turnitin yourself — report the
   ZeroGPT before/after as the proxy, and tell the user to re-submit to Turnitin
   for the real number. Be explicit that ZeroGPT is a proxy, not Turnitin.

## Calibration & honesty

- **ZeroGPT is a free proxy. Turnitin is the ground truth.** Never promise a
  Turnitin number from a ZeroGPT number.
- **Real human academic prose scores 0–50%, not 0** (a confirmed-human 2018 BERT
  abstract scored 50% on ZeroGPT). The honest target is "indistinguishable from
  the human distribution," not zero. Don't burn rounds chasing 0.
- **Best-of-N beats one shot.** Score variance is dominated by sampling, not by
  the text — the same input can swing 0–52% across attempts. When a sentence is
  stuck, generating 2–3 independent rewrites and keeping the lowest-scoring one is
  the single most reliable lever.

## Known limits (state these plainly; don't pretend)

- **Detector-saturated topics** — clinical SSRI/CBT, monetary policy/QE, common
  legal/historical essays — lock at 50–100% AI even for genuinely human prose,
  because those prompts flood the detector's training set. If a topic won't drop
  below ~50 after 3 rounds, say so and recommend manual editing rather than
  promising < 20.
- ZeroGPT truncates beyond ~14k chars; `detect.mjs` auto-chunks longer docs but
  the aggregate score is approximate.
- A free proxy can disagree with Turnitin by 20+ points in either direction.
