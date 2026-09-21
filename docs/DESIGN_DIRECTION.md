# SchoolOS — Design Direction

**Branch:** `ui-redesign` · Phase 1 · Written before any UI code.

---

## 1. What we are borrowing, and from where

Not a mood board. Each row is a specific mechanism to copy, and the reason it fits SchoolOS.

| Reference | The specific thing we take | Where it lands in SchoolOS |
| --- | --- | --- |
| **Linear** — sidebar | Nav items are 28–30px tall with a 16px icon and 13px label, grouped under quiet section headers. The active item is a filled row, not a coloured left bar. Almost no chrome. | `AppSidebar`. Admin's nine items become three groups: *People* (Students, Teachers), *Academics* (Classes, Subjects, Assignments, Timetable), *School* (Notices, Achievements). Dashboard sits above the groups, ungrouped. |
| **Linear** — command palette | `Ctrl K` opens a flat list of destinations, filtered by fuzzy match, no categories until you type. | `CommandPalette`, navigation only, filtered to the routes the current role may visit. |
| **Stripe Dashboard** — tables | Rows about 52px, no card wrapper, header row is a thin rule rather than a grey block. Numbers right-aligned and tabular. Row actions appear on hover at the right edge. | Admin Students and Assignments. The current design wraps every table in `rounded-xl border bg-white`; that wrapper goes. |
| **Attio** — filter chips | Filters sit above the table as removable chips that read as a sentence, and the result count updates next to them. | Students: class filter and search become chips reading "Class 7 · 24 results". |
| **Google Calendar** — week grid | Fixed-height hour rows, day columns of equal width, a thin coloured line across the current time with a dot on the left gutter. Events are flat blocks, not cards. | `TimetableGrid`. Sunday–Thursday columns (from `activeDays`), 09:00–14:00 rows. The current-period line uses `highlighter`. |
| **Cal.com** — time gutter | The time label sits at the top edge of its row in small tabular type, not vertically centred. | The timetable's left gutter. |
| **Google Classroom** — assignment stream | Each assignment row leads with the title, then the due date, then a submission fraction like "18/24 turned in". Status is a word, not a colour. | Teacher Homework list. |
| **Google Classroom** — grading panel | A roster down one side, the selected student's work filling the rest, marks entry pinned where the eye already is. | Teacher Homework detail — this is what replaces `window.prompt()`. |
| **ClassDojo** — child switcher | Children are avatar pills along the top; the whole page is scoped to the selected child; the switcher never disappears even with one child. | Guardian dashboard. Today the switcher is hidden when there is one child, which makes the scope ambiguous. |
| **Brightwheel** — calm alerts | An absence is stated plainly with the date and subject, in a bordered row, never in red-filled panels. | Guardian attendance summary. |
| **Khan Academy** — encouragement | Warmth comes from copy and one drawn illustration per empty state, not from colour or motion. | Student side only. |
| **Claude / ChatGPT** — message layout | Messages are full-width rows separated by generous space, distinguished by a small label and background tint, not by chat bubbles alternating left and right. | Student AI Learning. The current alternating-bubble layout handles long Bangla paragraphs badly. |
| **Khanmigo** — source chips | Citations appear under the answer as small outlined chips naming chapter and page. | AI Learning, driven by `sourceChunkIds`. |
| **Stripe / Linear marketing** | The hero shows a real screenshot of the product, cropped and angled slightly, with a plain headline. No abstract graphics. | Landing hero: a real render of the admin timetable. |
| **Vercel / GitHub settings** | Each setting is a row: label and description on the left, control on the right, sections separated by rules. | Profile page, and any settings surface. |

---

## 2. Palette

Six named roles. Everything else is a neutral step or a status colour.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--ink` | `#1B2240` | `#E8EAF2` | Primary text. A navy-black, not pure grey — closer to fountain-pen ink on an exercise book. |
| `--school-blue` | `#2446C9` | `#5C7DEA` | The one brand colour. Primary buttons, active nav, links, focus rings. Deliberately deeper and slightly more violet than Tailwind's `blue-600`, so it does not read as a default. |
| `--paper` | `#F6F7FA` | `#12162B` | App background. Dark mode is a deep navy-slate, never near-black. |
| `--surface` | `#FFFFFF` | `#1A1F38` | Cards, sheets, table surfaces. |
| `--lavender-wash` | `#EEF0FA` | `#232A48` | Selected rows, active nav background, the subtle secondary surface. Used quietly. |
| `--highlighter` | `#F4C542` | `#E0B43A` | **Reserved for "now".** The current period in the timetable, the next class, today's date. Nothing else. |
| `--line` | `#E3E6EE` | `#2C3350` | Borders and dividers. |

**Status** — always icon plus text, never colour alone. Muted, not neon.

| Status | Light fg / bg | Meaning |
| --- | --- | --- |
| Present / success | `#0F7B57` on `#E7F5EF` | Present, Submitted, Graded, Active |
| Absent / error | `#B4243C` on `#FCEAED` | Absent, Overdue, Inactive |
| Leave / warning | `#9A6510` on `#FDF3E2` | Leave, Due soon, Draft |
| Info | `#1C5D93` on `#E8F1F9` | Notices, neutral information |

**Subject tints** — eight desaturated colours, like coloured pencil on newsprint. Each is a background tint carrying `ink` text, so every one passes AA without a second foreground colour.

| Subject | Tint | | Subject | Tint |
| --- | --- | --- | --- | --- |
| Bangla | `#F3E8E4` | | Science | `#E4EFE6` |
| English | `#E6EAF4` | | ICT | `#E9E6F2` |
| Mathematics | `#E4EDF2` | | BGS | `#F2EDE2` |
| History & Social Science | `#EFE7EC` | | Religion & Moral Values | `#E7EFEF` |

Assignment is by subject `code` (BAN, ENG, MAT, SCI, ICT, BGS, HSS, REL), so the mapping is stable across reseeds and never depends on array order.

---

## 3. Typography

**UI face: Onest.** Chosen over Inter deliberately. Onest has slightly narrower, more humanist letterforms that keep dense admin tables readable at 13–14px, and it ships true `tnum` tabular figures, which marks, student IDs and capacity counts need in order to align in columns. **Verified**, not assumed: parsing the GSUB/GPOS feature list of the live Google Fonts file gives `calt ccmp kern locl mark mkmk pnum tnum` — `tnum` is present. Loaded via `next/font/google` with `variable: '--font-ui'`.

**Bangla face: Hind Siliguri**, loaded with `next/font/google`, subset `bengali`, weights 400/500/600. **Verified** against the live Google Fonts stylesheet: the Bengali face covers `U+0980–09FE` at all three weights. Bangla is bound to its own CSS variable and applied through a `.bn` class and a `:lang(bn)` rule, with `line-height` raised to 1.75 (against 1.5 for Latin) because Bangla's ascenders and the মাত্রা headline need the extra room. Bangla is never a fallback glyph inside a Latin stack; it gets its own stack, so it is first-class rather than an afterthought.

Tabular numerals (`font-variant-numeric: tabular-nums`) are the default in tables, stat figures, time gutters and mark fields — not globally, because tabular figures look stiff in prose.

| Role | Size / weight / leading |
| --- | --- |
| Page title | 27px / 600 / 1.2 |
| Section title | 17px / 600 / 1.35 |
| Body | 14.5px / 400 / 1.55 |
| Body, dense (tables) | 13.5px / 400 / 1.45 |
| Label | 13px / 500 / 1.4 |
| Meta | 12px / 400 / 1.4, muted |
| Numeric display | 24–30px / 600, tabular |

Sentence case everywhere, including buttons and table headers. No ALL-CAPS tracked-out labels.

**Radii, by level** — different radii for different things, so hierarchy is legible without shadows: inputs and chips 6px, buttons 8px, cards and table containers 12px, dialogs and sheets 16px.

**Shadows** — only on things that actually float: dropdowns, popovers, dialogs, sheets, toasts. Cards, tables and sections get a `line` border instead. There is no resting shadow anywhere in the app.

---

## 4. Layout

4px spacing scale. Content left-aligned. Max content width 1440px. Admin pages are dense; student and guardian pages get roughly 1.5× the vertical rhythm.

### Admin dashboard

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ SchoolOS   │  Dashboard                          [ Search  Ctrl K ] ☾ ◉  │
│ Barishal   ├──────────────────────────────────────────────────────────────┤
│ Zilla Sch. │                                                              │
│            │  Students   Teachers   Classes   Present today               │
│ Dashboard  │  200        15         8         174 of 200                  │
│            │  ──────────────────────────────────────────────────────────  │
│ PEOPLE     │                                                              │
│  Students  │  Today's routine · Monday, 21 September                      │
│  Teachers  │  ┌──────┬─────────────────────────────────┬───────────────┐  │
│            │  │09:00 │ BGS  বাংলাদেশ ও গ্লোবাল স্টাডিজ  │ Class 3 A     │  │
│ ACADEMICS  │  │      │ Shahida Akter                   │ Room 103      │  │
│  Classes   │  ├──────┼─────────────────────────────────┼───────────────┤  │
│  Subjects  │  │10:00 │ Mathematics  গণিত               │ Class 7 A     │  │ ← highlighter
│  Assignm.  │  │ NOW  │ Md. Abul Kalam                  │ Room 107      │  │   line: current
│  Timetable │  ├──────┼─────────────────────────────────┼───────────────┤  │   period
│            │  │11:00 │ English  ইংরেজি                  │ Class 10 A    │  │
│ SCHOOL     │  └──────┴─────────────────────────────────┴───────────────┘  │
│  Notices   │                                                              │
│  Achievem. │  Notices & events            Recent activity                 │
│            │  ─────────────────────        ─────────────────────          │
│            │  Parent-Teacher Meeting       Sima Islam admitted to Class 3 │
│ ─────────  │  28 Sep · Event               Marks published · Class 9      │
│ Admin ⌄    │  Annual Sports Day                                           │
└────────────┴──────────────────────────────────────────────────────────────┘
```

The summary strip is **one row of plain figures with labels** and a hairline under it — not four cards with gradient icon circles. "Present today" is a real fraction from the attendance data, and it is simply omitted when no sessions have been recorded, rather than showing an invented trend.

### Teacher attendance

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│            │  Take attendance                                             │
│ Dashboard  │  Class 7 A · Mathematics · Monday 21 Sep · 10:00–11:00        │
│ Attendance ├──────────────────────────────────────────────────────────────┤
│ Homework   │  [Mark all present] [Mark all absent]                        │
│ Results    │                    Present 22   Absent 1   Leave 1           │
│            │  ──────────────────────────────────────────────────────────  │
│            │   1  ◍  Sima Islam            STU001  [Present│Absent│Leave] │
│            │   2  ◍  Rahim Ahmed           STU014  [Present│Absent│Leave] │
│            │   3  ◍  Fatema Begum          STU027  [Present│Absent│Leave] │
│            │   4  ◍  Tanvir Hossain        STU031  [Present│Absent│Leave] │
│            │      ...                                                     │
│            ├──────────────────────────────────────────────────────────────┤
│            │  24 of 24 marked                        [ Save attendance ]  │  ← sticky
└────────────┴──────────────────────────────────────────────────────────────┘
```

A three-way segmented control, so the current state is always visible and any state is one click away. Today's badge cycles Present → Absent → Leave on click, which means marking one student absent can take two clicks and gives no hint that it will. The session header carries class, subject, date and time as **separate labelled facts**, not a middle-dot string.

### Student dashboard

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│            │  Good morning, Sima                                          │
│ Dashboard  │  Class 3 A · Sunday, 21 September                            │
│ Attendance ├──────────────────────────────────────────────────────────────┤
│ Homework   │  Next class                                                  │
│ Results    │  ┌────────────────────────────────────────────────────────┐  │
│ Notices    │  │  11:00   Mathematics                                   │  │
│ AI Learning│  │          গণিত · Md. Abul Kalam · Room 103              │  │
│            │  └────────────────────────────────────────────────────────┘  │
│            │                                                              │
│            │  Due soon                      Attendance                    │
│            │  ─────────────────────          ─────────────────────        │
│            │  Fractions worksheet            87%                          │
│            │  Mathematics · due Thu          13 of 15 classes             │
│            │  Paragraph: My village          ▓▓▓▓▓▓▓▓▓░                   │
│            │  Bangla · due Sun                                            │
│            │                                                              │
│            │  Ask about your textbook          Latest results             │
│            │  ─────────────────────            ─────────────────────      │
│            │  [ Start a question ]             Mathematics      A         │
│            │                                   Bangla           A+        │
└────────────┴──────────────────────────────────────────────────────────────┘
```

**The one bold element is "Next class."** Everything else on the page is quiet. No emoji in the greeting. The AI entry point is a plain section with a normal button, not a gradient banner.

---

## 5. Principles — what makes this a Bangladeshi school's own product

SchoolOS should read as software made *for* Barishal Zilla School, not as a dashboard template that a school's data was poured into. Four things carry that.

**Bangla is structural, not decorative.** Every subject in the database already has a `nameBn`, and the current UI shows none of them. In the redesign, a subject is always its English name with the Bangla underneath in Hind Siliguri — in timetable blocks, subject chips, homework headers and report cards. Bangla gets its own font stack and its own line-height, so it never looks like a fallback glyph wedged into a Latin face.

**The timetable is the রুটিন.** In a Bangladeshi school the printed routine on the notice board is the single most-consulted document, and its grid — days across, periods down, one subject and teacher per cell — is already familiar to every teacher and student here. We keep that exact mental model rather than replacing it with a generic calendar, and we use the school's real Sunday-to-Thursday week from `activeDays` instead of the Monday-to-Friday week that every Western template assumes. The digital gain over paper is one thing paper cannot do: a line marking the period happening right now.

**Dates, names and numbers follow local convention.** Dates read "21 Sep 2026", not "9/21/2026". Names keep their honorifics as seeded — "Md. Abul Kalam" stays whole and is never split into first and last. Marks and GPA follow the grading scale that comes from settings, so A+ is 5.00 as it is on a real Bangladeshi transcript.

**Restraint is the house style.** One brand colour with a job. `highlighter` yellow reserved strictly for "now". Borders for structure, shadows only for things that float. One bold element per screen and everything else quiet. A school office runs the same five screens all day, every day — the interface should recede after the first week rather than keep performing.

---

## 6. Self-review against Section 3

I checked this plan against the anti-pattern list and revised four things.

**Revised — the stat row.** My first sketch had the usual four cards across the top of the admin dashboard, each with an icon in a tinted circle. That is the single most recognisable generated-dashboard tell, and the trend chips those cards normally carry would have been fabricated, since the API returns no historical series. Replaced with one row of plain figures and labels above a hairline. The figures are the four the API actually returns, plus a real present-today fraction that is omitted when no sessions exist.

**Revised — the AI Learning entry point.** I had sketched a full-width gradient banner with a sparkle icon, which is the anti-pattern list almost verbatim. It is now an ordinary dashboard section with a plain heading and a normal button. It earns attention through position, not decoration.

**Revised — middle-dot meta strings.** The existing code is full of `Class 7 · Section A · 38 students`, and I had carried the habit into the attendance header. Rewritten as labelled facts in a row, so each value is readable on its own and screen readers get a sensible reading order. The one place a middle dot survives is the student dashboard subtitle, where "Class 3 A · Sunday, 21 September" is genuinely two short facts and a table would be absurd.

**Revised — the landing hero.** The natural move was an abstract illustration or a 3D textbook. Instead the hero shows a real, cropped render of the admin timetable with real seeded names, the way Stripe and Linear show their actual product. No `@react-three/fiber`, so the 3D dependency is not added at all. The existing 7-slide photo carousel of the actual school stays, restyled — real photographs of the real campus are exactly the kind of specificity the brief asks for, and nothing generated could replace them.

**Checked and confirmed clean:** no gradient text, buttons or backgrounds anywhere; no glassmorphism (the current sticky nav uses `backdrop-blur-md` and loses it); no uniform radius — four levels, by hierarchy; no emoji in UI copy (the student dashboard's `👋` and the AI page's `📚` and `⚠️` both go); no ALL-CAPS eyebrow labels; no arrows appended to buttons; no numbered `01 / 02 / 03` markers; no floating 3D shapes; Inter is replaced by a deliberate choice; no scroll-triggered fade-ups, and hover lift is removed from the cards that currently have it.

**Motion budget.** Route crossfade 150ms. Sidebar active indicator via `layoutId`. Tab indicator slide. Dialogs and sheets 200ms fade plus slight scale or edge slide. Button press and inline submit spinner. Attendance status colour transition and count tick. Capacity and attendance bars animate once on first load. Toasts slide in. One orchestrated moment in the whole product: the landing hero on load. Nothing else animates on its own. Everything sits at 120–250ms, ease-out, under `MotionConfig reducedMotion="user"`.

**One decoration removed per screen**, as Section 9 requires — tracked per screen during the build. Already committed: the hover shadow on class and achievement cards, the icon circle on every stat, the grey `bg-slate-50` block behind every table header, and the `rounded-xl border` wrapper around tables that are already visually contained.
