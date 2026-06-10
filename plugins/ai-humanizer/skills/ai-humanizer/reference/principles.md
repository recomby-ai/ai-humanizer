# Why the ai-humanizer rules are what they are

This is the evidence layer. SKILL.md tells you *what* to do; this file is *why*,
distilled from ~15 controlled experiments (7–13 fixtures each) against ZeroGPT as
external ground truth, plus confirmed-human baselines. Read it when a rule seems
arbitrary, when a rewrite is stuck, or before you're tempted to "improve" the
playbook with folklore. Most folklore is wrong here; these findings are measured.

## Finding 1 — the signal is lexical predictability, not connectives

Directly compared three real samples through ZeroGPT:
- Confirmed-human 2014 Bahdanau NMT abstract → **0%**.
- Band-9 IELTS sample (ex-examiner authored), full of "Firstly / Secondly / On
  the other hand / Furthermore / Consequently" → **19.6%**.
- Polished AI clinical review using **none** of those connectives → **100%**.

Conclusion: "AI words like Furthermore/Moreover/plays a crucial role" is a **false
signal**. Templatable openers ("X is a recently proposed approach") are also not
the signal — Bahdanau opens exactly that way at 0%. The detector keys on
**perplexity-like lexical predictability**: how default and high-probability each
next word is. This is why the phrase-ban list helps only at the margin, and why
the real lever is vocabulary precision + structural roughness.

## Finding 2 — fluency is the tell; polish upward = score upward

In one experiment two outputs were both judged high-quality by an LLM rubric:
- Run A (AI **0%**): passive constructions, a parenthetical wedged inside the
  opener ("After applying a random-effects model to our analysis of 47 RCTs
  (n = 6,832 participants)..."), long subordinate-clause stacking — authentic
  rough edges of human writing under deadline.
- Run B (AI **100%**): every sentence the smoothest possible version, top-tier
  journal fluency.

**AI score correlates with sentence fluency, not register.** The path to a lower
score runs through *allowing imperfection*, not through casualizing. This is the
basis for "allow slight awkwardness" and "prefer longer idea-dense sentences."

## Finding 3 — for academic content, MORE precision, not less

The Reddit "make it sound human / explain to a friend / inject slang" advice is
**backwards for academic text**. What actually lowers the score:
- Swap high-probability domain vocabulary for **low-probability precise**
  alternatives ("patients with comorbid depression" → "those presenting with
  concurrent depressive symptomatology").
- Force **technical residue**: niche field-specific terms and notation an LLM
  rarely emits for that topic. Bahdanau's "(soft-)search", "fixed-length vector"
  are why it reads human.
- Keep long, information-dense sentences. Do **not** chop them up.

Caveat from Finding 6: precision alone does not rescue saturated topics.

## Finding 4 — real human prose is 0–50%, not 0

| sample | ZeroGPT |
|---|---|
| 2014 Bahdanau abstract (confirmed human, pre-LLM) | 0% |
| Band-9 IELTS official sample | 19.6% |
| 2018 BERT abstract (confirmed human) | 50% |

Targeting 0% treats AI-score as a quality metric — it isn't. The realistic goal
is **match the human distribution**. Confirmed-human academic writing gets flagged
at 50% sometimes; 100% reproducibility of a low score is impossible. Don't burn
rounds chasing 0.

## Finding 5 — variance is sampling-dominated; best-of-N is the biggest lever

The same fixture at the same temperature scored anywhere from **0 to 52%** across
runs. Variance comes from the rewriter's sampling, not from the text or the
temperature. Consequence measured directly:
- Single-shot strict pass rate: **4%**.
- Best-of-3 (independent rewrites, keep the lowest scorer subject to term
  preservation): **25%** — a 6× lift.

When a sentence or document is stuck, the highest-yield move is **more independent
attempts**, not a cleverer single prompt. As an agent you get this nearly for free
by generating 2–3 variants of a stuck sentence and detecting each.

## Finding 6 — topic saturation is a hard floor

Clinical (SSRI/CBT), monetary policy (QE), common legal/historical essays lock at
**50–100% AI even for human-quality prose**, across every technique tried (5+
distinct approaches all hit 100% on clinical). These prompts are over-represented
as AI-generated in the detector's training set. Real human Cochrane abstracts also
score 41–47% in this band — the floor exists for humans too. **Do not promise
< 30 on a saturated topic.** Report the floor honestly and suggest manual editing.

## Finding 7 — register-lock and AI-score are antagonistic

Pushing register/formality to 9–10 (IELTS-anchoring, "precision" prompts,
register-lock) reliably pushed AI score to **100** on most fixtures. The lone
exception was a narrow-technical engineering fixture (ASTM/FRP/fatigue notation)
whose residue ZeroGPT covers thinly. Don't optimize register as a proxy for
humanness — they pull opposite directions.

## Anti-patterns (measured to backfire — do not reintroduce)

- **Positive style anchors / "here is a human sample, imitate it":** the rewriter
  mimics the *surface* of the sample instead of attacking the detector signal.
  Cost **−23 points** vs the same prompt without anchors.
- **Long numbered rulebook (29 rules from a "signs of AI" guide):** too many
  constraints paralyzed the rewriter into near-identical copies — mean Δ ≈ 0.
  Keep the active instruction set tight and negative-only.
- **Back-translation EN→ZH→EN:** kills proper nouns, logic, and aesthetics.
  User-rejected.
- **Sentence-level isolation (rewrite each sentence with no context):** destroys
  cohesion; score didn't improve enough to justify it.
- **Unicode-space substitution (U+2009 etc.):** trivially fools ZeroGPT but is a
  visible hack a human reviewer catches by inspection. Not real humanization.
- **A second free detector as an extra gate (HF roberta, MAGE, OpenAI-RoBERTa):**
  on GPT-4-era text these return ~99% "Real" with no discrimination, or fail to
  load. A second *independent* signal needs a self-hosted perplexity model, not a
  free API.

## The algorithm in one line

Detector-guided iterative paraphrase (arxiv 2506.07001, "Adversarial
Paraphrasing"; cf. 2303.13408 DIPPER): a detector flags sentences → rewrite only
those under the rules above → re-detect → loop, keeping the best snapshot and
never dropping a protected term. Training-free, model-agnostic, which is exactly
why it ports cleanly into a skill where the agent itself is the rewriter.

## What porting to a skill changed vs the original termsafe app

- The separate DeepSeek rewriter API is gone — **the agent is the rewriter**. This
  also means: switching agents (Claude ↔ Codex ↔ other) gives you free
  rewriter-model diversity, which the original couldn't get (single-model lexical
  fingerprint was a suspected wall).
- No Cloudflare 50-subrequest cap and no 500-word limit — `detect.mjs` chunks long
  docs. Best-of-N (Finding 5) is now just "generate more variants," not a paid-tier
  architecture change.
- ZeroGPT stays as the keyless baseline. GPTZero/Originality can be swapped in by
  editing `detect.mjs` (they need an API key; ZeroGPT does not).
