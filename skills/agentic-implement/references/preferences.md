# Default preferences: code and product text

Defaults for any project using these skills; each project may edit this file. The writer applies
them in step 6 of `agentic-implement`; the reviewer checks the diff against them (the standards lens
of `agentic-code-review`). The project's `AGENTS.md` supplies project-specific vocabulary and stack
and overrides this file. The interface has its own source: the project's design system and
`<agentic-design>/references/ui-without-slop.md` (`<agentic-design>` is the sibling skill located as
`agentic-implement`'s `SKILL.md` describes; normally the neighboring folder).

## Code

- Code serves any customer, not just the first: what varies between customers (name, domain, IP,
  tables, values) comes from data or configuration; examples use example domains. A product serving
  multiple customers breaks on the second if it hardcodes what belonged to the first.
- A new customer, with zero records and unfinished configuration, is a first-class case: it has a
  test, and the screen says what is missing instead of looking broken.
- Prove the absence of hardcoded values with a search (`git grep` for the current customer's name
  in production code returns empty), rather than asserting it.

## Product text

- Follow the language declared by the project's `AGENTS.md`, and English otherwise, including
  spelling, vocabulary, date and number formats.
- Text the end user reads (screen, PDF, email, SMS, including server-generated text) says what
  happens in domain language: no marketing or jargon, following B14 and B15 of
  `<agentic-design>/references/ui-without-slop.md`.
- Published text serves its reader: no working notes (“From an SEO perspective…”, “Before
  publishing, …”) or unsourced statistics reach it.
- Images: the filename describes what is visible, in the product's language (lowercase, hyphens,
  no accents), never the tool that generated it; `alt` describes it (on a public site, with brand
  and location); `width` and `height` match the file; crop in the file rather than `object-position`.
  Filename and `alt` count in image search, and a file crop applies everywhere the image appears.
