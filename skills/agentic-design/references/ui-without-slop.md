# Interfaces without AI aesthetics

Read before designing or reviewing any screen, component, generated document (PDF, email, SMS)
or chart. Applies to mockups, variants and code. Belongs to the `agentic-design` skill and also
lives in projects' `.agentic/ui-without-slop.md`, for agents without the skill: it therefore
contains everything needed to design and review without any other file.

**Contents**

1. [Principle: freedom in style, prohibition of tics](#1-principle)
2. [Blockers](#2-blockers): B1–B24, each with how to recognise it, why it is bad and one possible way out
3. [What to do well](#3-what-to-do-well)
4. [Process: real variants, screenshots, human choice](#4-process)
5. [Review checklist](#5-review-checklist)
6. [Legitimate escape](#6-legitimate-escape)
7. [The mechanical detector](#7-the-mechanical-detector)

## 1. Principle

**Style is free; tics are not.** Composition, typography, colour, density and personality are
free choices, provided they are coherent with the project's design system. What is forbidden
is the list in section 2: patterns that signal "AI-generated" at first glance. People who see
them lose trust in the product, even when the content is good. A typical product owner's
critique is that the content may be right, but the design is ugly. A calm style can also be
original: originality lies in the relationship between concept, structure and use, not the
number of effects.

**Surface mode.** On a screen to operate (app, tool) or read (documentation, generated document),
blockers apply in full. On a website or landing page, to persuade, B9 and the part of B18 about
animated entrances, counters and animated backgrounds yield to what that project's `DESIGN.md`
declares with the owner; other blockers apply.

Before designing, read what exists and extend it:

- **Tokens:** colours, typography, spacing, radii and shadows (theme file, CSS variables,
  Tailwind configuration).
- **Shared components:** list row, table, page header, empty state, button.
- **Neighbouring screens** the user opens before and after this one.
- **The project's design document** (`DESIGN.md` or equivalent), if present. Its rules take
  precedence over this file.

Never invent a parallel system (another palette, radius scale or button) for a single screen.
If the system falls short, propose extending the system itself, for all screens.

Find current references from mature products with the same kind of use (professional tools,
email clients, calendars, editors), not inspiration galleries. Those galleries are where
the tics come from.

## 2. Blockers

Each item has three parts. **Recognise it** says how to see it, concretely and verifiably:
this, and only this, blocks. **Why it is bad** says what the tic costs. **Instead** gives one
possible way out: an example, not a rule; any design outside "Recognise it" works. Numbers
(heights, sizes, radii) are references, not mandatory measurements, except readability and
contrast minimums (B3, B12) and minimum click and touch targets (section 3).

### Colour and surface

**B1. Purple/indigo gradients and decorative gradients.**
Recognise it: `linear-gradient`/`bg-gradient-to-*` with purple, indigo or violet; a gradient
on a section, hero, card or button background without a function.
Not the tic: the owner's chosen brand gradient, defined in a token and declared (section 6),
used where the owner approved it.
Why it is bad: it is the best-known signature of generated UI, and the gradient competes with content.
Instead: flat token colours. If the brand needs depth, use a lightness step in the same hue,
applied only to the frame or primary action, and only if the system provides for it.

**B2. Pastel pills and badges everywhere.**
Recognise it (one is enough), counting labels with light coloured backgrounds ("pills") on a screen:
- **colour without a word:** in a greyscale screenshot, the state can no longer be read (the
  pill or dot has no text, or the text does not state the status);
- **colour without meaning:** more than 3 pills on screen and colours do not follow a "this
  colour = this meaning" rule written in the design system (same colour for different states,
  different colours for the same state, or colour chosen for variety);
- **colour on everything:** more than half the rows in a list have a pill or state colour,
  including rows that need nothing (already completed, paid, active).
Not the tic: pills with text, one meaning per colour written in the system, and fewer than half
the rows, whatever their shape or colour.
Why it is bad: it teaches people to read colour rather than words; when everything has colour,
the colour that matters (notice, error) disappears.
Instead: one option is the full state in text colour, reserving colour for what needs attention
(notice, error). Pill, dot or icon + word also work, provided they do not meet "Recognise it".

**B3. Grey on grey and low contrast.**
Recognise it: light-grey secondary text on a grey background, faded labels, informative icons
at 3:1; contrast measured on the token rather than the painted value against the actual background.
Why it is bad: it looks elegant in a screenshot and is unreadable on an office screen, with
reflections or for people over 40.
Instead: text ≥ 4.5:1 and informative icons/outlines ≥ 3:1, measured against the actual background.
Build hierarchy with size and weight, not fading.

**B4. Hairlines, greys and dividers used as structure.**
Recognise it (one is enough):
- **the cover test:** in a screenshot, paint hairlines and low-contrast backgrounds (< 3:1 with
  their neighbours) the neighbouring surface colour. If screen zones become indistinguishable
  because nothing else separates them (space, alignment, title, surface change with measured
  contrast), that is the tic;
- **the series of dividers:** `hr`, `border-top`/`border-bottom`, `divide-y`, a pseudo-element or
  a 1 px shadow between sections or items already distinguished by title, space and alignment.
  The tic is functionless repetition, not the property: replacing `hr` with a 1 px shadow keeps it;
- **the grey canvas:** in light mode, a grey background under content to separate it from the frame.
Not the tic: functional boundaries (the editable field, through outline, background or shadow;
focus, error and selection; time guides in a grid; row and column relationships in a table when
comparison requires them) and a single separation between two groups. A table does not require
every line just because it is a table: each must help comparison. A regex cannot distinguish
decoration from function: decide from the composition, with the screenshot in front of you.
Why it is bad: in light mode, low-contrast hairlines and greys read as dirt, not structure, and
the screen becomes flat; repeated dividers fragment what space already grouped.
Instead: space, alignment, titles and a solid work surface; separate frame and work through a
frame material defined by the design system. When removing a series, do not replace it with a
card, shadow or background per item. Scope matters: removing requested dividers does not authorise
erasing the application's identity or functional borders.

**B5. Tokens doing two jobs.**
Recognise it: the same colour serves branding and "success"; the same token is text in one
place and background elsewhere. Symptoms are "the colour we chose is not what appears", or
a dull app with nothing wrong.
Why it is bad: the most demanding job dictates the value, and a bulk replacement breaks the
other jobs without notice.
Instead: one job per token. Before a bulk colour change, classify each use by what the colour
says there (state, semantics, scale point, brand). If a token is both text and surface, split it
into two with the same contrast contract. A contrast guard measures ink/background pairs declared
in the same CSS rule, in each theme, not a token list: that list describes the old job and ages
when a token changes jobs.

**B6. Colours outside the tokens.**
Recognise it: loose hex, `rgb()` or `hsl()` in a component; raw palette classes (`bg-blue-500`)
in a project with tokens; a shade "almost the same" as the system's.
Why it is bad: it diverges from the theme (dark mode forgets it) and accumulates variants nobody
can change together.
Instead: use the token. If one is missing, propose it to the system with contrast measured in
each project theme; the human decides, before designing. Exceptions are in section 6.

### Structure and composition

**B7. Cards for everything, and cards inside cards.**
Recognise it: each block in a box with border and shadow; box inside box inside box; a mosaic
of equal-sized cards filling the page.
Why it is bad: it fragments, consumes margin space and hides hierarchy; the page looks like a
generic dashboard.
Instead: unboxed sections with a strong title, space and an aligned grid. A surface must mean
a group, object or layer: reserve cards for meaningful elevation (a draggable item, a floating
layer). A panel reused inside another loses its title, frame and illustration.

**B8. Lists of loose cards, or rows with "View" and ellipses.**
Recognise it (one is enough), in a list of comparable items of the same type:
- **loose cards:** each item is a card with border or shadow and its own margin, in a list of
  5 or more items;
- **misaligned columns:** the same field (name, date, value, state) starts at a different x from
  row to row, or a number sits against its label rather than in a column;
- **numbers that cannot be compared:** a value column aligned left or without tabular figures;
- **repeated "View":** the same button or link ("View", "Open", "Details") on every row,
  instead of the row being the link;
- **clipped decision-making content:** name, message or value cut to "…" with free space on the
  row, or no way to read the full text;
- **selection by pastel background alone:** the selected row differs only by a light background.
Not the tic: tall or compact rows, zebra striping, table row hairlines required for column
comparison (and passing B4), and cards in a grid of non-comparable items (image gallery).
Shape is free.
Why it is bad: this is the most frequent case of "the content is good, the design is ugly".
The eye cannot find columns, and decision-making content (who, how much, when) is clipped.
Instead, one possible way out:
- Rows with the grid defined on the list (subgrid or fixed-width columns), not each row.
- Row height suited to use, with text ≥ 13 px; the row is a click target and follows section 3
  targets (44 px recommended, 24 px minimum).
- Right-aligned numbers, with tabular figures, in their own column.
- The whole row is the link. The row action is a sibling button, not a button inside another,
  and secondary actions go into a "⋯" menu.
- A message may take 2 lines and the name stays complete; write the state as text at a fixed
  position in the row.
- Distinguish the selected row through shape, weight or a mark as well as background.

**B9. Landing page composition: vague hero, three identical columns, everything centred.**
Recognise it: a large centred heading ("The smarter way to…") with "Get started" and "Learn more"
side by side; three (or six) identical blocks with an icon in a circle, two-word title and two
lines of text; centred paragraphs and forms.
Not the tic: on a website, the hero and narrative that the project's `DESIGN.md` declares with
the owner (surface mode, section 1). A working tool never requires a hero.
Why it is bad: it is standard generated-site filler. Symmetry pretends three things have equal
value, and reading tires without a stable left margin. In a work app, it steals task space.
Instead: in an app, open on today's task. On a website, say what the product does and for whom,
in domain words, with one primary action and the product working (real screenshot). Body text
and forms have a stable left margin; reserve centring for single short pieces (a title, a
confirmation dialog).

**B10. Decorative metrics and KPIs.**
Recognise it: a row of number cards ("Total", "Growth +12%") nobody uses for decisions; a
coloured icon on each card; numbers that open nothing.
Why it is bad: it fills the first screen with things that do not change the next action,
teaching people to ignore numbers.
Instead: only numbers that change a decision. Each number has one name and one definition across
screens, and clicking it opens the filtered list with the same row count. Shape is free (a line
of numbers, a chart, colour on the data itself), provided it is not the row of generic cards with
an icon on each. Numbers only from the product, never invented as filler.

**B11. Empty states that only say "No data".**
Recognise it: "No data", "Nothing to show", a large illustration and no action.
Why it is bad: an empty state is not an answer. New arrivals cannot tell whether it is failure,
a filter or completed work.
Instead: say what it means ("No orders to send today") and the next action, with a button.
A new account sees the missing steps, not zeros. The reverse also matters: a large empty area
on a wide screen is not "clean". Compose with useful content (what comes next, what needs
attention, the day's rhythm), without falling into B10.

### Text

**B12. Too much small text.**
Recognise it: a grey subtitle below every title; a two-line summary under each menu entry;
text below 12 px; repeated counts ("61 records" beside the list showing them).
Why it is bad: it clutters and drowns what matters; it almost always repeats what content shows.
Instead: keep secondary text only if it changes the person's next decision or action and is not
already visible. In shared components, the subtitle is optional with no default value; do not
render it if it repeats the title. In a redesign, inventory: text, location, keep or remove,
why. Minimum 12 px; 13–14 px in data rows and table headers.

**B13. Spaced uppercase overlines and decorative numbering.**
Recognise it: "OVERVIEW" at 11 px with tracking above the title; "01 / Section"; dashes
decorating headings.
Why it is bad: the small-text layer in another disguise, and a landing-page template tic.
Instead: the title is enough. Labels use sentence case, without tracking.

**B14. Marketing microcopy.**
Recognise it: "Unlock your full potential", "effortless", "Welcome back! 👋", "everything in
one place", "seamless", "supercharge", exclamations and enthusiasm.
Why it is bad: it sounds like an advert inside a work tool and nobody believes it.
Instead: say what happens, in domain words: "Save", "3 orders to send", "Sign in".
One verb per button and no promise.

**B15. System phrases and technical jargon for the end user.**
Recognise it: notices explaining implementation ("Values may change until…"); visible codes,
hashes, versions or IDs; "-" in empty fields; an overline repeating the title ("Order" above
"Book order"); business rules written on the screen.
Why it is bad: the document or screen speaks to its builder, not its reader. In a PDF or email,
it represents the customer.
Instead: identity, person, date, a clear title, content and signature. Omit empty fields.
Legal text is only what the law requires. A necessary technical reference stays discreet
("Ref." in the footer).

### Icons, shape and motion

**B16. Emojis as icons, ✨, and decorative icons in coloured circles.**
Recognise it: 🚀 ✨ 📊 👋 in titles, buttons, empty states or menus; ✨ marking "smart" or
"new"; each section, card or metric with an icon inside a pastel circle.
Not the tic: emoji used as data, such as reactions users choose or text people write (section 6).
Why it is bad: it is the easiest tic to recognise. Emoji renders differently on each system and
does not follow the theme; a circled icon is ornament that distinguishes nothing (all are alike).
Instead: the project's outline icon set, in text colour, and only when it helps find something
(e.g. navigation). When unsure, use the word.

**B17. Shadows and very rounded corners on everything.**
Recognise it: `rounded-2xl`/`3xl` on cards, fields and buttons; broad diffuse shadows on blocks
that do not float; "cute" pill buttons; coloured glow around buttons; coloured side borders
marking cards.
Why it is bad: it reads as childish and templated; shadows everywhere erase the one elevation
that matters (dialog, menu).
Instead: the project's radius scale (typically 4–12 px). Large radii only on pills, avatars and
switches. Large shadows only on what floats above content.

**B18. Gratuitous animations.**
Recognise it: numbers counting from 0 to their value; backgrounds with breathing gradients;
elements sliding in on every load; `transition: all`; hover moving the target; continuous
animation outside a real wait.
Not the tic: on a website, entrance motion and counters declared with the owner in the project's
`DESIGN.md` (section 1); a wait indicator while the wait is real (B19).
Why it is bad: it delays reading and tires people. Continuous animation behind blur spends GPU
constantly and loses clicks on modest machines. Hover that moves a target on a touchscreen turns
the first tap into selection and requires a second. Animation does not prove authorisation,
progress or success (B23).
Instead: the full value in the first frame. Motion only explains a state change (open, close,
reorder), is short (≤ 200 ms for a state change; gestures use springs) and stops with
`prefers-reduced-motion`. Hover effects stay inside `@media (hover: hover)` and never use
`transform` on navigation targets.

**B19. Skeletons and spinners for instant data.**
Recognise it: a shimmering skeleton for 50 ms; a spinner when switching tabs with data already
in memory; a list returning to its skeleton when returning from detail.
Why it is bad: the page flickers, making a fast operation look slow.
Instead: keep previous data while new data arrives. Show the indicator only after ~300 ms,
and the skeleton only on the first slow load, shaped like the actual content.

**B20. Ghost buttons competing with the primary action, or primaries everywhere.**
Recognise it: three equally weighted buttons at the top; a primary on every list row (25 blue
buttons per page); an action that is only coloured text without shape; secondary actions drawn
as 1 px outlines.
Why it is bad: when everything is primary, nothing is. An action that looks like text cannot
be found; an outline on every button is the same line used as structure in B4.
Instead: one dominant action per screen. Secondary actions have a tonal background (or a light
shadow), or go in the menu; no button is bounded by a line, in any state (including disabled,
segmented or chip), except the focus ring and `forced-colors`. In a list, only the most urgent
row may have the primary. An action is never just colour or text: it has background or shape
and a click cursor.
Exception: in a confirmation step, both exits ("Yes, cancel" and "Keep") may have equal weight
to avoid pushing towards "yes"; distinguish the destructive one by text saying what is lost,
not colour alone.

**B21. Decorative textures in backgrounds or marking states.**
Recognise it: a dot or line grid, noise ("grain") or diffuse glow behind content without a
function; cancelled or unavailable items marked only with stripes or hatching.
Not the tic: texture explaining a task property, limited to where it serves (checkerboard
behind a transparent image, a canvas or floor-plan grid).
Why it is bad: it is standard generated-page filler, and texture outweighs the content that
should be in front; a state marked only by pattern cannot be read aloud or on a reflective screen.
Instead: a flat token background. Hide what no longer counts by default (with a filter to
show it), or show it faded with the word ("Cancelled"), distinguished by more than pattern.

### Material, state and interaction

**B22. Glass and blur behind content.**
Recognise it: `backdrop-filter` or a translucent surface behind lists, tables, forms or body
text; glass across the whole page; an animated background behind a blurred surface.
Not the tic: brand material on the frame (sidebar; top bar gaining glass as content scrolls
underneath) and floating layers, with content on a solid surface and respect for
`prefers-reduced-transparency`.
Why it is bad: text loses contrast against what passes behind it, and recalculating blur every
frame burdens modest machines and loses clicks.
Instead: a solid work surface, with glass on the frame and a static background.

**B23. Pretend states.**
Recognise it: progress advancing on a timer; a success notice before the server response; a
padlock or "secure" without an underlying contract; a "saving" animation unconnected to a
request; invented counts or presence; a dark pattern to extract consent.
Why it is bad: the interface lies, and when it fails the person has already acted as though it
succeeded.
Instead: each state comes from a system fact; the indicator is indeterminate when there is no
measured fraction; success appears after the response, at the action's location. Skeleton,
indeterminate indicator, percentage and result are different states.

**B24. Interaction that exists only in the screenshot.**
Recognise it: information or action only on hover; information only in a tooltip; a control
without an accessible name; an input hidden with `display: none` serving as checkbox or radio;
a button that does not look like a button.
Why it is bad: the screenshot looks good, but the screen cannot be used with keyboard, touch
or a screen reader.
Instead: a focusable native input with associated label; decision-making content stays visible;
hover only reinforces what focus and touch also show.

## 3. What to do well

Without imposing style: properties any good design has.

- **Hierarchy follows the primary action.** On opening, one thing: the current work on the
  first screen, at the user's actual resolution. Help, history and configuration come later.
- **Density serves use.** A professional tool used all day favours density over generous white
  space. Frequent tasks need no scrolling and fit within ≤ 2 clicks.
- **One job per token**, as B5 says. A new colour enters through the system with measured contrast.
- **All states are designed:** empty, loading, error, no permission and lots of data (real
  pagination, long names, 500 rows). A page without data does not fake a full dashboard.
- **Text is readable:** body 14–16 px, data ≥ 13 px, headings larger than body text. A section
  heading smaller than the text makes the page look timid.
- **If the project has light and dark, the same shape with different colours.** Test both with
  screenshots and never approve one without seeing the other. A single-theme project does not
  acquire another because of a feature.
- **The screen is consistent with its neighbours.** The same component does the same job. A
  screen shared by several roles has one implementation with permission-based sections;
  copies per role diverge, and one becomes ugly.
- **Actual width is what counts.** Layout responds to remaining space (open side panels,
  collapsed bar), not the window. Container queries are the default.
- **Accessibility:** AA contrast measured on the painted value, visible focus, a complete
  keyboard path, click and touch targets ≥ 44 × 44 px (recommended), never below 24 × 24 px
  (WCAG 2.2 AA minimum, criterion 2.5.8). Inputs with text ≥ 16 px on mobile, otherwise iOS
  zooms. No horizontal page scrolling from 320 px (WCAG 2.2, 1.4.10) to the largest target
  width; two-dimensional content (wide table, map, editor, calendar grid) may scroll inside
  its component. Hiding overflow with `overflow-x: hidden` is not responsive.
- **Restrained charts:** a soft palette defined as tokens in each theme, series distinguishable
  by more than colour (name, shape, dashes), legend text ≥ 14 px and a discreet grid. No
  gradients, glow or shadows on bars, and never invented data to resemble the reference.

## 4. Process

The full procedure is `agentic-design`'s "variants" mode (its `variants.md`). The essentials:
capture the current state (baseline); make 2–3 variants that disagree on structure, not just
colour, using project tokens and realistic data; run them through the detector, section 5
checklist and another agent's critique before showing them; the human chooses ("you choose"
counts); the chosen variant is the review reference, compared through real screenshots in
the same states and widths. A screenshot does not prove it works: on an interactive screen,
click and confirm that state changes.

## 5. Review checklist

For the independent reviewer (`agentic-code-review`'s UI lens). Each "no" is a finding tied to
the blocker in parentheses. Start with the detector (last item; exits in §7): with exit 1,
each blocker on a diff line is Important, with the detector line as proof, to be fixed or
given `slop-ok: <reason>` when it is a project decision (§6); exit 2 counts as red until unread
files have been checked manually. Then the list, against screenshots of the chosen variant.

- [ ] No decorative or purple/indigo gradients, except the declared brand gradient (section 6)? (B1)
- [ ] In greyscale, every state is still readable, each pill colour has a meaning written in the system, and fewer than half the rows have state colour? (B2)
- [ ] All text passes 4.5:1, and informative icons 3:1, against the actual background, in each project theme? (B3)
- [ ] After covering hairlines and backgrounds below 3:1, screen zones remain distinct? No series of dividers between things already separated by space and titles, and no grey canvas in light mode? (B4)
- [ ] Each new or changed token does one job? (B5)
- [ ] No literal colours outside tokens, or each has `slop-ok` with a reason? (B6)
- [ ] No cards inside cards or card mosaics? (B7)
- [ ] In lists of comparable items: no loose cards, each field at the same x on every row, numbers right-aligned and tabular, no repeated View, no clipped decision-making content, and selection distinguished by more than background? (B8)
- [ ] The top opens on the task, without a vague hero, symmetric icon + title + text grids, or centred paragraphs and forms? (B9)
- [ ] Each number changes a decision, comes from the product and opens its corresponding list? (B10)
- [ ] Each empty state says what it means and gives the next action? No large area empty without reason on wide screens? (B11)
- [ ] Each secondary text changes a decision and does not repeat content? Nothing below 12 px? (B12)
- [ ] No spaced uppercase overlines or decorative numbering? (B13)
- [ ] Microcopy says what happens, without marketing or exclamations? (B14)
- [ ] No system phrases, codes or dashes visible to the end user? (B15)
- [ ] No emojis as icons (those used as data, section 6, do not count) or icons in coloured circles decorating headings? (B16)
- [ ] Radii follow the project's scale, and large shadows stay on floating layers? (B17)
- [ ] Motion explains a change, stops with reduced motion, and hover does not move targets on touch? (B18)
- [ ] Skeletons and spinners appear only during a real wait? (B19)
- [ ] One dominant action (or two equally weighted choices in a confirmation, with text distinguishing the destructive one), every action looks clickable, and no button is bounded by a line? (B20)
- [ ] No decorative background textures, and no state marked only by stripes or hatching? (B21)
- [ ] Glass and blur stay on the frame and floating layers, with content on a solid surface and a static background? (B22)
- [ ] Every state (progress, success, saving, counts, security) comes from a system fact? (B23)
- [ ] Decision-making content is visible and works with keyboard and touch, without depending on hover or a tooltip, and each control has a name? (B24)
- [ ] With the logo covered and beside a neighbouring screen, it looks like the same app rather than a generic template?
- [ ] The screen was seen in screenshots at target resolutions, in each project theme, populated and empty (or, on a single-record screen, in agreed states), and with side panels open? (section 4)
- [ ] Implementation matches the chosen variant? (section 4)
- [ ] `node <skill>/scripts/detect-slop.mjs --diff <base>` (`<skill>` is the `agentic-design` folder; in a project, `.agentic/detect-slop.mjs`) exits 0 (listed pre-existing findings stay in one report line, without going to the backlog), each escape under "Escapes used" has a reason that is a decision rather than laziness, and each "Allowed" line really is data or the declared brand token? (section 7)

## 6. Legitimate escape

The rule opposes tics, not product-owner decisions. When the project's design system deliberately
uses something on the list, follow the project and record why:

- **In code**, `slop-ok: <reason>` in a comment at the end of the line, or alone on the previous
  line; for several consecutive lines, `slop-ok-block: <reason>` … `slop-ok-end`. In JSON,
  which has no comments, a `"//": "slop-ok: <reason>"` line before the key. The reason states
  the decision ("bright-red data loss warning, approved by the owner, see DESIGN.md"), not
  "necessary". The detector lists all used escapes, with reasons, for the reviewer to judge.
- **In the design document**, write the exception with its scope: where it applies and where it does not.
- **In the project declaration**, `.agentic/ui.json` at the repository root, for repeated things
  that do not need a comment on every use. Currently declares brand gradients (see below). It
  is a repository file: commit it, with the owner's decision in `DESIGN.md` or an ADR.

Exceptions that are usually legitimate:

- **Brand material chosen by the owner** (a translucent surface, a brand gradient on the frame
  or a website hero): applies where approved, does not spread to content. Define a brand
  gradient **once**, in a token (`--brand-gradient: linear-gradient(…)`), and declare it in
  `.agentic/ui.json`:

  ```json
  { "brand_gradients": ["--brand-gradient"] }
  ```

  The detector allows that token's definition (CSS variable, `$brand-gradient` in Sass or the
  `brand-gradient` config key, such as Tailwind's `backgroundImage`) and declarations using it
  with `var(--brand-gradient)`, listing each under "Allowed". Handwritten gradients (even with
  brand colours), Tailwind gradient classes (`from-violet-600`…) and any undeclared token still
  block: the brand therefore has one gradient, not twenty variants.
- **Security alerts** (risk to a person, data loss, serious error) in vivid colours outside
  tokens, because they must shout louder than the brand.
- **Colours that are data**, not theme: chart series, the colour a user chose for a resource,
  an avatar's hue.
- **Emojis that are data**, not icons: user-chosen reactions, an emoji picker, content written
  by people (messages, comments). The rule is **data ≠ icon**:
  - **Data, does not block:** emoji arriving through data, props or an API (`{reaction.emoji}`),
    which the detector cannot see; an emoji-only literal in a list (`["👍", "🎉"]`, including
    lists split across lines) or object value (`{ id: "like", emoji: "👍" }`); a content-key
    value (`emoji`, `reaction`, `message`, `comment`, `content`, `body`…), even beside text;
    in a translation, an emoji-only value (`"likeReaction": "👍"`). The detector lists each
    under "Allowed" for the reviewer to confirm it is data.
  - **Icon, blocks:** a literal in JSX or HTML (`<h2>✨ What's new</h2>`, `<button>🚀</button>`),
    in an attribute (`icon="⭐"`), in an icon or UI-text key (`icon`, `label`, `title`,
    `heading`, `button`, `menu`…), in a standalone constant (`const NEWS = "🔥"`), in an HTML
    template, or beside text in a translation (`"✨ What's new"`).
  - A case the detector misreads (data with a label key, for instance) gets
    `slop-ok-block: <reason>`; an icon that passed as data is a reviewer finding (B16).
- **A listed pattern that research shows has a clear function** in category reference products
  (reference research, with a source): do not block or adopt it alone; propose it to the human
  before designing or at the gate.
- **An explicit human request** for something on the list: do it. State the cost once (e.g.
  measured contrast) and record it. Preserve an approved effect (an animated card outline,
  glass frame) where it was approved.

When a project has no system, section 2 applies in full and the first screen defines tokens
that later screens reuse: its own tokens, coherent with the direction, not a recycled universal
palette. In an existing product, the current grammar is the reference: a new direction does not
authorise redesigning login, changing the font or transplanting another identity.

## 7. The mechanical detector

`scripts/detect-slop.mjs`, in this skill's folder (Node ≥ 20, no dependencies; below, `<skill>`
is the folder where agentic-design is installed; in a project with a versioned copy,
`.agentic/detect-slop.mjs` does the same), catches only what a text pattern can catch precisely;
ugly lists, empty states without an answer and hierarchy remain checklist work. It is the floor,
not the ceiling. Run from the project repository root (`--diff` uses the current folder's git),
at the end of each UI slice and before requesting review:

```bash
node <skill>/scripts/detect-slop.mjs --diff "$(git merge-base origin/main HEAD)"   # changed lines since the base (+ new files)
node <skill>/scripts/detect-slop.mjs src/app src/components   # whole folders; --json for another agent
node <skill>/scripts/detect-slop.mjs <mockup-folder>           # HTML variants, before showing them
```

| Exit | Rules |
|---|---|
| 1 (blocker) | `purple-gradient`, `background-gradient` (section/hero), `emoji`, `small-text` (< 12 px), `marketing-microcopy`, `spaced-uppercase` (B13), `transition-all` (B18), `escape-no-reason`, `escape-no-end` |
| 0 (notice, listed) | `literal-color`, `large-radius` (≥ 20 px outside pills/avatars), `large-shadow` (blur ≥ 20 px outside floating layers, 3+ in the set), `no-data`, `hover-moves-target` (the `:hover` target moves outside `@media (hover: hover)`; B18), `continuous-motion` (infinite animation outside a wait; B18), `glass-on-content` (blur outside the frame and floating layers; B22), `side-border` (≥ 2 px outside navigation, active item and quotes; B17), `outlined-button` (button with an outline; B20), `empty-dash` (a dash in an empty field; B15), `decorative-numbering` ("01 / …"; B13) |
| 2 (fail closed) | invalid argument, unreadable file, invalid git ref or repository, invalid `.agentic/ui.json`, no files analysed, or UI files it cannot read ("Not analysed" list) |

Outside the detector because they need judgement: repeated dividers (B4), pills (B2), contrast
(B3, measured in the browser), cards, lists, hero and KPIs (B7–B10), numbers counting from 0
(B18), pretend states (B23) and interaction only in the screenshot (B24).

Analyses `.css .scss .tsx .jsx .js .mjs .cjs .ts .mts .cts` (including HTML and `<style>` in
template strings) and `.html .vue .svelte .astro` and server templates (`.hbs .njk .ejs .erb
.liquid .twig .jinja`). In translation files (`.po .arb .xliff .strings`, and `.json .yml
.properties` in `locales/`, `i18n/`… folders or language-named files such as `en.json`), applies
only text rules (emoji, marketing, "no data"). Ignores comments, tests, `.d.ts`, minified files,
`node_modules` and builds. Fix a blocker or escape it with a reason (section 6), never ignore it.

**"0 files analysed" is not clean.** Exit 2: unread content does not count as proof. In `--diff`,
a changed file with HTML markup in an extension the detector does not read (a template in `.py`,
`.php`, `.rb`…) appears under "Not analysed" and also exits 2: check it manually against section 2
(especially B1, B12, B14 and B16), record it in the report and run the detector on the remainder
(`--diff <base> <paths>`) to obtain exit 0.

**A blocker that was already there.** `--diff` reads `git diff -U0 <base>` hunks and counts
only added or changed lines; a new file, including one not yet tracked by git, counts in full.
A finding on an untouched line appears under "Pre-existing", does not affect the exit code and
is not fixed along the way (each diff line is tied to the request): it stays in one report and
retro line, without going to the backlog. Exception: when the task is to redesign that screen,
fix it and run the detector on files (`node <skill>/scripts/detect-slop.mjs <file>`), reading
them in full.

**Escapes.** Output lists every used escape (file, line, reason and what it suppresses), also
in `--json`. The reviewer judges each reason.

**Allowed without an escape.** Emoji as data and a brand gradient declared in `.agentic/ui.json`
(section 6) do not block, but appear under "Allowed" (`allowed` in `--json`), with file, line
and reason. The reviewer confirms each emoji really is data and each gradient uses the declared
token. The detector reads `.agentic/ui.json` from the current folder's git repository root
(outside a repository, the current folder); if it is not JSON or `brand_gradients` is not a
list of token names, it exits 2.
