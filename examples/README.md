# Examples

Real runs of the skill, with before/after scores, term-preservation results, and
the reasoning. Both use ZeroGPT (the keyless baseline) as the detector.

| # | input | domain | result |
|---|---|---|---|
| [01](01-nursing-essay.md) | 408-word GPT essay | normal academic | **100% → 11.1%** in one round, 7/7 terms kept |
| [02](02-clinical-saturated-domain.md) | GPT meta-analysis abstract | saturated (clinical) | best-of-N: variants at **0%** and **26.5%**, 14/14 terms kept — teaches the variance/honesty lesson |

Example 2 is the one to read if you only read one: it shows why a single rewrite
is not enough (a 26-point swing on identical instructions) and why the skill
refuses to over-promise on detector-saturated topics.

> Scores are from ZeroGPT, a free *proxy*. Turnitin is the ground truth — re-check
> there before relying on any number here.
