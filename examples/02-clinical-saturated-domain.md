# Example 2 — clinical meta-analysis (saturated domain + the variance lesson)

A GPT-written SSRI-vs-CBT meta-analysis abstract for generalized anxiety
disorder — dense with drug names, citations, and statistics. This domain is
*detector-saturated*: clinical SSRI/CBT prompts flood detector training sets, so
they historically lock at 50–100% AI even for genuinely human prose. This example
shows two things at once: **high-density term preservation works**, and **why you
must run best-of-N instead of trusting one rewrite.**

| version | ZeroGPT | terms kept | note |
|---|---|---|---|
| original AI text | **100%** | — | stable on re-detect |
| rewrite **variant 1** | **0%** | 14 / 14 | best-of-N keeps this one |
| rewrite **variant 2** | **26.5%** | 14 / 14 | same rules, independent sampling |

14 protected items, including `Hedges' g = 0.62`, `95% CI: 0.48-0.76`,
`p < 0.001`, `n = 6,832`, `47 randomized controlled trials`,
`Hofmann et al. (2012)`, `Cuijpers et al. (2016)`, plus `SSRIs`, `CBT`, `GAD`
and their full forms — **all survived both rewrites character-for-character.**

## The two honest lessons

**1. A single 0% is a sample, not a verdict.** Variant 1 hit 0% on a domain that
historically locks high. That could mean the proxy detector drifted, that the
rewrite happened to land in the low-perplexity-with-roughness sweet spot, or just
luck. The skill does **not** let you claim "saturated domains are solved" off one
run — it reports the score and the caveat.

**2. A 26-point spread on identical instructions is why best-of-N is the #1
lever.** Same original, same rules — only the rewrite's sampling differed — and
the scores were 0% vs 26.5%. Re-detecting the *same fixed text* is stable (the
original re-detects at 100% every time), so the variance lives in the **rewrite**,
not the detector. If you run once and happen to draw variant 2, you stop at 26.5%.
Generate a few variants, keep the lowest. (Measured elsewhere: single-shot strict
pass 4% → best-of-3 25%.)

## Before (AI, 100%)

> This systematic review examines the comparative efficacy of selective serotonin
> reuptake inhibitors (SSRIs) versus cognitive-behavioral therapy (CBT) in the
> treatment of generalized anxiety disorder (GAD). […] These findings suggest that
> integrative treatment approaches play a crucial role in addressing the
> multifaceted nature of GAD. Furthermore, subgroup analyses revealed […]
> Ultimately, these results underscore the need for personalized therapeutic
> frameworks that account for the intricate interplay of biological and
> psychological factors, highlighting the importance of evidence-based clinical
> decision-making.

## After — variant 1 (0%, the kept version)

> What this systematic review sets out to weigh is a single comparison: selective
> serotonin reuptake inhibitors (SSRIs) against cognitive-behavioral therapy (CBT)
> for generalized anxiety disorder (GAD). That both do something is not in dispute
> — Hofmann et al. (2012) and Cuijpers et al. (2016) had already put statistically
> significant effects on the record for either modality. The sharper result here
> comes from pooling 47 randomized controlled trials (n = 6,832): the two delivered
> together outperformed either alone, Hedges' g = 0.62 (95% CI: 0.48-0.76,
> p < 0.001). […] The subgroup picture sharpens it further — patients with comorbid
> depression were the ones who gained most from the combination, not the average
> patient.

## Caveat the skill always states

ZeroGPT is a **free proxy**, not Turnitin. On a saturated clinical topic the real
Turnitin number can still be higher, and a proxy can disagree with Turnitin by
20+ points either way. Before submitting anything, re-check the kept version in
Turnitin itself — do not treat this 0% as a Turnitin guarantee.
