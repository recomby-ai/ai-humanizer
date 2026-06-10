# Example 1 — nursing essay (normal academic domain)

A 408-word GPT-written essay on evidence-based research databases in nursing.
One round of the skill took it from **100% → 11.1%** on ZeroGPT, with **7/7**
protected terms intact. 11.1% sits squarely in the human band (real human
academic prose scores 0–50%), so the loop stopped — no point chasing 0.

| metric | before | after |
|---|---|---|
| ZeroGPT AI score | **100%** | **11.1%** |
| flagged sentences | 20 / 20 | 2 / 20 |
| protected terms kept | — | **7 / 7** |
| invented content | — | none |
| rounds | — | 1 |

Protected domain entities (the agent's NER pass — the regex layer found no
numbers/citations here): `evidence-based research`, `evidence-based practice`,
`integrative review`, `analytical study`, `electronic health record`,
`research literacy`, `critical appraisal`.

## Before (AI, 100%)

> Evidence-based research databases in nursing practice have the potential to
> revolutionize patient care and improve patient outcomes. These databases
> provide nurses with access to comprehensive and reliable information, enabling
> them to make informed decisions and deliver the best possible care to their
> patients. Moreover, utilizing evidence-based research can also have significant
> implications on nurse-related policy changes.
>
> Integrative reviews and analytical studies play a vital role in informing and
> guiding policy decisions. […] Thus, evidence-based research databases can have a
> direct impact on policy decisions that shape the nursing profession.
>
> In order to fully harness the benefits of evidence-based research […] Ultimately,
> these results underscore […]

## After (rewrite, 11.1%)

> What a good evidence-based research database changes, in nursing, is less the
> bedside gesture than the reasoning behind it: when nurses can reach trustworthy
> information quickly, the decisions they make about a patient rest on something
> firmer, and the care tends to follow. The same databases matter a second way
> that gets less attention — they feed into how nurse-related policy gets set, not
> only how individual patients get treated.
>
> Two kinds of study do most of that work. An integrative review pulls together
> what is already known on a question into a single synthesis; an analytical study
> goes after a narrower thing — whether a given intervention or treatment actually
> works, and how well. […]
>
> None of this pays off unless nurses can actually get at trustworthy information,
> which makes access the real bottleneck […] open up the evidence-based research
> databases and wire them into the electronic health record […]

## What changed, and why it lowered the score

- **Killed the AI-tell vocabulary**: `revolutionize`, `comprehensive`,
  `play a vital/crucial role`, `harness`, `Moreover`, `Thus`, `Ultimately`,
  `underscore` — these correlate with high-probability, low-perplexity output.
- **Broke the smoothness**: subject-first topic sentences became subordinate-clause
  and object-first openers; short parallel sentences were merged into longer,
  idea-dense ones. Fluency is the tell — slight roughness reads as human.
- **Preserved every term of art verbatim** and **added no new claim**. The logic
  (databases → reliable info → decisions/policy → two-level access strategy →
  conclusion) is unchanged.
