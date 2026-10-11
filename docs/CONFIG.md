# Configuring Mentor Desk

Everything about *your* event lives in one file. `public/event.config.js` re-exports a preset:

```js
export { default } from './presets/hackathon.js';
```

To make your own, copy `public/presets/hackathon.js` to `public/presets/my-event.js`, edit it, and point `event.config.js` at it. The same file is read by the server and both apps, so there is nothing to rebuild. Restart `npm run dev` or redeploy.

Run `npm test` after editing: it walks a whole event through your config.

## Fields

### `event`
| Field | Example | Used for |
|---|---|---|
| `name` | `'HackNight'` | Header, wordmark, page titles, export file names |
| `tagline` | `'Mentor desk'` | Small line under the name |
| `route` | `'CCJ ✈ DXB'` | Optional flourish on the join and briefing screens |
| `hours` | `'6 PM – 6 AM'` | Briefing screen |
| `timezone` | `'Asia/Kolkata'` | Every time shown in the apps |
| `locale` | `'en-IN'` | Time formatting |

### `theme`
`primary`, `primaryDeep`, `accent`, `accentDeep`: hex colours. Primary is headings, card outlines and the live-round card; accent is buttons and highlights. Light tints are mixed automatically.

### `rounds`
Exactly four check-in rounds: `{ n, title, time, asks }`. `time` is only a label; organizers open each round by hand from the Live tab. `asks` is the one-line summary on the mentor briefing. Any round can be skipped on the night (Live → Skip), so design round 3 to also cover round 2's questions if you might skip it.

### `skills`
What mentors can help with. Mentors pick theirs when they join; help requests are routed to matching mentors.

### `helpTypes`
`[label, skills]` pairs for the "Ask for help" screen. `skills` is the mentor skill(s) that get alerted, `'A|B'` for either, or `null` for no routing (still visible to everyone).

### `copy`
Short pieces of text the apps use around your theme:

| Field | Shown |
|---|---|
| `themeLinkLabel` | Label for the round-1 `theme` answer on team pages, judge pages and the judge brief |
| `goalLabel` | Label for the round-1 `goal` answer |
| `ideaHeading` | Heading of the "what they said in round 1" card |
| `waiting` | Mentor home before any round is open |
| `joinLead` | Under "Hello, mentor" on sign-up |
| `briefLead` | Intro of the mentor briefing |
| `rubricNote` | Note under the rubric on the briefing (HTML allowed) |
| `prizeLine` | Kept for your own use in copy |
| `collegeLabel` | Label of the "college you're connected to" field |

### `forms`
One form per round (`1`–`4`): `{ title, hint, questions }`. Questions:

```js
{ id: 'building', type: 'text', label: 'What are they building?', ph: 'placeholder', req: true }
{ id: 'clarity',  type: 'one',  label: 'Is the idea clear?', options: [['Very clear', 'g'], ['Unclear', 'r']] }
{ id: 'buildType', type: 'many', label: 'Build type', options: ['Hardware', 'Software'] }
{ section: 'Your read' }                                  // a divider
{ id: 'whyNot', type: 'text', label: 'Why not?', showIf: ['onTrack', 'No'] }   // conditional
```

- `type`: `text` (free text), `one` (pick one), `many` (pick any).
- Option colour (second item): `g` green, `y` yellow, `o` orange, `r` red, `b` blue. On a `numbered` question the second item is the description instead.
- `req: true` makes it required; `hint` adds small help text; `inline: true` lays options in a row.

#### Question ids the engine understands

You can add, remove and reword questions freely. These ids switch on built-in features, so keep them if you want the feature:

| Round | id | Feature |
|---|---|---|
| 1 | `building` | One-line project summary: team page, judge page, booth list, judge brief |
| 1 | `theme` | Theme link (label from `copy.themeLinkLabel`) |
| 1 | `goal` | Their goal (label from `copy.goalLabel`) |
| 1 | `plan` | Choosing the **red** (`'r'`) option puts the team on *Needs attention* |
| 1 | `help` | Each skill ticked raises a help request routed to mentors with that skill |
| 2, 3 | `onTrack` + `whyNot` | Answer `No` raises an "Off track" alert for organizers with the reason |
| 3 | `works` | "Not ready" signal on the Finalists board |
| 3 | `recommend` | Finalist points: `Yes` +1, `Maybe` +0.5 |
| 3 | `strengths` | Strength tags on the Finalists board |
| 4 | `demoReady` | Demo-ready column and tie-break on the Finalists board |
| 4 | `built`, `strongest`, `weakest` | The judge brief |
| 4 | `rating` | Finalist points: `'4'` +2, `'3'` +1 (use values `'1'`–`'4'`) |

Each mentor's top-two picks (from any team they checked during the night) add +1 per pick.

### `noteKeys`, `noteLabels`
Which earlier answers the next mentor sees at the top of their form, per round, and their labels. Keep these to facts (what they built, what's blocking them); ratings are never shown to other mentors.

### `rubric`
The morning judging criteria: `{ id, label, max, hint? }`. Judges tap one of six levels per criterion (0 to `max` in fifths, rounded to one decimal). The total is the sum of `max`. Use short ids (letters only) and avoid `total` and `note`.

### `judging`
- `booths`: `true` (default) runs a demo-booth round where judges nominate teams. `false` skips it: the night's signal goes straight to the shortlist and finalist scoring, and the booth stage disappears from the Live tab and the mentor briefing.
- `nominationTarget`: a suggested number of booth nominations per judge, shown as "suggested 3, optional". Nominating is never required. `0` hides the hint.
- `shortlistSize`: the "top-N" cut line on the Finalists board, and the size of each judge's *Must-see* booth list.
- `picksLockAt`: label for when top-two picks close.
- `stages`: `booths`, `shortlist`, `finals`, `done`, each `{ time, title, text }` for the briefing and the Live tab.

### `floorTables`
`false`: tables show as typed (`15` → "Table 15"). `true`: `UPPER 4` → "Upper · Table 4" and plain numbers become "Lower · Table N", for venues with two floors.

### `practiceTeams`
Names for Setup → Load practice data.

## Changing config mid-event

Labels, copy, times and colours are safe to change any time. Changing question **ids** or rubric **ids** after people have answered means older answers won't show under the new ids, so settle those before the event.
