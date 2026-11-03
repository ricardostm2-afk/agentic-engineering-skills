# Profiles: what each one writes

Q2 chooses the profile (the language) and Q3 the granularity (how many nodes, and their size). Together
they determine the data's texts. All examples below are invented, about a function that calculates a
shopping cart's total: yours cite only what you read.

Each node, step and concept always has both texts, `simple` and `technical`. The page switches between
them with one click, so a wrong calibration can be corrected without regenerating everything. The
profile determines which text the page shows first (Simple in A, Technical in B and C) and how you
write the first of the two.

| | A | B | C |
|---|---|---|---|
| Who | does not know the concepts, or asks for no jargon | knows the basics, not these patterns | proficient |
| Language | everyday words; a technical term only after explaining it | the field's vocabulary; explain each new term on first use | technical and direct; do not explain what the profile knows |
| Document | “What happens when …”, with metaphors and “Key concept” boxes | the flow step by step, with citations and a mini-glossary | trade-offs, edge cases and failure points, with citations |
| Granularity | blocks or components | blocks or components | blocks or detail |
| Only in this profile | | | `risk` on nodes, `mode` on edges and messages |

## Granularity

- **blocks** (helicopter): 5 to 8 nodes in total, each a large part. The validator rejects anything
  outside that range.
- **components** (X-ray in profiles A and B): files, modules or system parts.
- **detail** (X-ray in profile C): functions, classes, states and fine mechanisms.

The validator rejects more than 60 nodes: group by folder or module before writing.

## Profile A: no unexplained jargon

**Language.** Short sentences and everyday words. One metaphor per idea, only one. Introduce a
technical term after explaining the idea, and never leave an acronym on its own. `technical` is
still required: it is the text for someone who clicks Technical, and can be written for profile B.

**Document.** Open with “What happens when …”. The `concepts` (up to 6) appear as “Key concept” boxes
right after the introduction. Each step covers one idea.

Good (a node's `simple` text):

> The program adds up the price of each thing you put in the cart. If you have a coupon, it takes
> its value off at the end, like a supermarket checkout that scans the coupon after adding up the shopping.

Bad, because it leaves the jargon unexplained:

> The `calculateTotal` function iterates over the line array and applies the discount to the accumulated subtotal.

## Profile B: the flow, with citations

**Language.** The field's vocabulary, without that of advanced techniques. Explain a new term on
first use; the most important ones go in `concepts`, which the page shows as a mini-glossary.

**Document.** The flow step by step, in the order things happen. Each step cites the file and lines
(`path:N-M`) it came from.

Good (a step's `technical` text):

> `calculateTotal` walks the lines and sums `price × quantity` (`src/cart/total.ts:12-20`).
> Only then does it apply the coupon to the subtotal (`src/cart/total.ts:22-27`), so a coupon
> never discounts shipping.

Bad, because it states the result rather than the path, and cites nothing:

> The cart calculates the total correctly with all business rules.

## Profile C: trade-offs and failure points

**Language.** Technical and direct. State what each decision gains and costs, what happens in edge
cases (empty, concurrency, error), and what breaks first. Do not explain what the profile knows.

**Document.** Trade-offs, edge cases and failure points, with citations. Each node has `risk` (`low`,
`medium` or `high`) and the text says why: the page shows risk through color, size and a word, but
the reason is yours. Each edge or message has `mode` (`sync` or `async`).

Good (the `technical` text of a `high` risk node):

> Sums using `number` and rounds at the end (`src/cart/total.ts:30`): cents are wrong with
> hundreds of lines. Trade-off: rounding per line would avoid the error, but would require changing
> the issued invoice. Fails first with prices that have 3 decimal places.

Bad, because it states there is risk without saying where or what avoiding it costs:

> This part is delicate and should be reviewed carefully.

## Switching profiles

Someone asking for another profile (“explain it again in profile C”) does not answer the questions
again: the agent rewrites the texts and granularity using what it already knows and generates the
page again. Since both texts of each node already exist, the page also lets the reader switch
between Simple and Technical without generating anything.
