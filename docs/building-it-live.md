# One night, 106 teams, and every bug we met on the way

*This is the story of building Mentor Desk live at LAYOVER 2026. Names of mentors and teams are left out.*

*What broke while we ran LAYOVER Mentor Desk live at an overnight hackathon, and what each bug taught us.*

---

LAYOVER was an overnight hackathon at TinkerSpace Calicut on 10–11 October 2026: a hundred-odd teams, eleven mentors, and a small web app we'd built that week to hold it together. Mentors walk the floor with their phones and check every team four times through the night. They raise and pick up help requests. In the morning the same app turns into their judging sheet. Organizers watch it all from a laptop.

The app is deliberately boring: static pages, one serverless function, Postgres. That held up well. Almost every bug we hit was about **people, time and data**, not about the stack. Here they are in roughly the order they arrived (times are approximate).

---

## Before check-in 1 — "Remove whatever data it has, mentors are onboarding now"

The night started with a demo. We loaded practice data (dummy teams marked `D-xx`) so mentors could try the app, wiped it, and reloaded it with a few more teams while mentors were signing up on their phones.

**The first lesson came before any code ran.** Between checking the live database and wiping it, someone had imported two real teams and a mentor had joined two minutes earlier. "Delete everything" took them too. Nothing important was lost; the mentor joined again and the teams were re-imported. But it set the rule for the rest of the night: **look at the live data right before a destructive action, not five minutes before**, and say exactly what will go. It also led to backups (see 9:30 PM).

The demo exposed the first real bug soon after.

## Still before check-in 1 — The mentor who kept getting the same team

> "In the mentors assigning part, the same mentor is getting the same team multiple times sometimes."

We couldn't reproduce it. The live check-in data had been wiped by the reset, so we went back to the code and found **three separate bugs that all look like this from a phone**:

1. **"Not at their spot" didn't move the team.** Each mentor sees the due teams in a fixed, mentor-specific order. If a mentor found a team away and tapped *Not at their spot*, the team stayed due, so it came straight back to the top of *their own* list, with only the pill changed from "Due" to "Away". Fix: teams already found away sink to the bottom, oldest first.
2. **History was tied to the sign-up, not the person.** "You saw them" (don't check the same team twice) matched by mentor ID. A mentor who signed out, switched phones or cleared their browser got a new ID and a clean slate. Fix: also match earlier check-ins by name. The trade-off is that two different mentors with exactly the same name would see each other's teams as "seen".
3. **The shuffle wasn't shuffling.** The "fixed per-mentor order" came from sorting teams by a hash of `mentorId + teamId`. While testing the first fix, the list came back as `21 20 23 22 25 24 27 26`, almost sequential. FNV-1a over strings that differ only in their last characters barely changes the high bits, so every mentor walked the room in runs of neighbouring teams, and mentors overlapped far more than intended. Fix: add a final avalanche mix (the standard `xorshift-multiply` finaliser) and a separator between the two ids.

**Lesson:** "It does X sometimes" with no data to look at usually means several causes, not one. Fix every path that produces the symptom you were told about, then say clearly which you couldn't confirm.

## Next — Small UI bugs that show up the moment you use the screen

Adding a team editor to the organizer dashboard went through a quick browser test, and it caught something immediately:

- **Typing a team name, then clicking "+ Add person", wiped the name.** The editor re-rendered the whole form from the original team object on every change, so anything typed into the name and code fields was lost. Fix: keep the form's state (name, code, table, people) in one object, sync it from the inputs before every re-render, and render from that.

And a scoring question turned into a real fix:

> "If a judge is not scoring a team because they know that team, that should not affect the average, right?"

The basic maths was right: the average divides by the judges who actually scored, not by everyone. But two edges were wrong:

- **A judge could score a team and *then* declare a conflict** ("I know this team", or adding that college to their profile). Their score still counted. Fix: when computing results, leave out any sheet from a judge who is connected to the team *now*, however late they declared it, and show it struck through as "not counted".
- **Ranking used averages rounded to 0.1.** 41.33 and 41.25 both showed as 41.3, so the tie-break decided the order and could put the lower team first. Fix: rank on the exact average and show two decimals so the order matches what organizers see.

**Lesson:** "Is this fair?" questions are worth answering with a test, not a yes. We set up four judges and five finalists and checked every combination of score-then-declare.

## 9:30 PM — Backups, and a crash hiding behind a test harness

After the 9 PM wipe, a **Backup / Restore** button in Setup was obviously needed. Restore had to be all-or-nothing, so we added a database transaction helper. Testing it found three bugs:

- **The first restore test failed with a generic "Something went wrong."** A damaged backup *was* correctly rejected and nothing changed, but the message gave the organizer nothing to go on. Fix: "Restore failed and nothing was changed. The backup file may be damaged or edited."
- **The backup file name used UTC.** At 9:27 PM local time it was named `…-1557.json`. Organizers in India would never find "the 9:30 backup". Fix: use local time in file names.
- **A real crash, found by accident.** Locally the app uses an embedded Postgres (PGlite); production uses the `pg` driver against Neon. To test the production code path we put PGlite behind a Postgres socket server. After a deliberately failed restore, that test server sent a protocol message the driver didn't expect, and **the whole Node process died**. The cause on our side: the `pg` connection pool had **no `error` handler**, so any error on an idle connection crashes the process. Neon closing an idle connection would have done the same in production. Fix: a pool error handler, and failed transaction connections are discarded instead of returned to the pool.

**Lesson:** test the production database path, not just the convenient one. The bug wasn't in the feature we were testing.

## 10:00 PM — Importing the real teams

The real team list arrived as a CSV: `No, Team Name, Table number, Team/individual`. One row per team, no member names, no colleges, and the app's importer expected one row per *person*. Several bugs came from that mismatch:

- **Duplicate names would have merged teams.** Two team names each appeared twice in the sheet (in one case a duo downstairs and an individual upstairs). The importer groups people into teams by team name, so each pair would have become one team. Fix: give the second one a location suffix, e.g. "NAME (UPPER)".
- **Names with quotes and commas.** Team names like `WHERE"S THE …?` and `NAME (A,B)` only survive a real CSV parser, not a `split(',')`.
- **We miscounted.** We first told the organizer "102 teams". The file had 103. Count with code, not by eye.
- **Table numbers had nowhere to live,** and mentors needed them to find teams. We added a `table_no` column and showed it everywhere. Then:
  - Individuals displayed as "ASHA · ASHA · solo", because the team name *is* the person's name. Fix: don't repeat a member name that equals the team name.
  - The dashboard said **38 people** for 103 teams, because duos without names counted as zero. Fix: a nameless duo counts as two.
  - On help cards the new location line became a third column, between the team name and the badge. Fix: wrap the name and location together.
- **"Upper" vs "lower" floors.** The sheet wrote upstairs tables as `UPPER 10` and downstairs ones as plain numbers. A small parser turned these into `Lower · Table 15` and `Upper · Table 10`. Later that night this turned out to matter more than it looked (see 1:10 AM).

**Lesson:** the data you get on event night never matches the format you designed for. Write a one-off script that parses, prints what's odd, and refuses to run if the target isn't empty, rather than hand-editing a spreadsheet.

## 12:20 AM — Thirty-eight things "need attention"

The organizer Live tab showed **38 items needing attention**, most of them more than 80 minutes old. The check-in 1 form has a "Do they need help?" question with skill chips, and every chip a mentor ticked became a help request automatically. Mentors ticked them freely, nobody picked them up, and the urgent items were buried under them.

It wasn't a crash, it was a design bug: an optional, low-effort question on a form created work in the shared queue. We flagged it and gave organizers tools to clear it (Resolve, delete, assign). The real fix is to think about which form answers should create work for someone else.

Same screen, same hour: **a mentor showed "On <team> for 95 min".** They had started a check-in and never submitted it.

## 12:30 AM — Skipping a round, and a bug that would have broken a fresh database

The organizers decided to skip check-in 2. Its questions were folded into check-in 3, and check-in 2 got a "Skipped" state on the Live tab so nobody would click it by accident.

Then we built a Mentors analysis tab: time per check-in, gaps, help time. Check-ins had never stored when they *started*, only when they were submitted, so we added columns. Testing against a restored copy of the live data, **the restore failed: `relation "flags" does not exist`.**

The schema is one long SQL string. New columns were `ALTER TABLE … ADD COLUMN IF NOT EXISTS` lines, and we had been inserting each one wherever was convenient. The `ALTER TABLE flags` line sat *above* `CREATE TABLE flags`. Production was fine, because the table already existed. On any **fresh** database (a new deploy, a teammate's laptop), setup would fail on that line. Locally it was worse: PGlite runs the schema as one script, so the error stopped every statement after it. Fix: all post-launch `ALTER`s live at the end of the schema, under a comment saying why.

The same tab had three display bugs:

- **The column headers were huge.** We used a CSS class called `num` for right-aligned numbers; the mentor app already used `.num` for the big round badges on the rating question. Fix: rename it.
- **"~54.6 min" read as "−54.6 min",** because the font's tilde looks like a minus sign. Fix: write "54.6 min to close".
- **Help times were inflated.** Without a pickup time, "time spent helping" was measured from when a request was *raised*, which included the hour it sat unclaimed. Fix: record `taken_at` from now on. For earlier requests, estimate the start as the later of when the request was raised and the mentor's previous action, and mark those times **est.**

And one we'd been ignoring: **the organizer dashboard didn't fit a phone.** The tab bar, the Needs attention rows and the mentors table all ran off the right edge. A small script listed which elements stuck out past the screen width, which made each one quick to fix.

**Lesson:** a schema that grows by hand-inserted `ALTER`s needs an order rule, and a test that builds a database from scratch.

## 12:50 AM — "This mentor's dashboard shows no teams"

This was the one bug report that wasn't a bug. We took a backup of the live data, restored it into a local copy, and loaded the mentor's screen with *their own sign-in*. Their list showed **8 teams due**, exactly as it should. Their "7 of 10 teams" was correct too: 7 check-ins done, against a fair share of about 10 (106 teams ÷ 11 mentors). The confusion came from the word "of": it read like ten teams had been assigned to them. Teams are shared; nobody is assigned anything.

**Lesson:** reproduce from the user's point of view with their real data before changing code. And watch for wording that suggests a model your system doesn't have.

## 1:00 AM — Two mentors, one team

> "Make the team locked and not openable if a mentor has already started checking on them."

The lock already existed, but it had two holes:

- **It expired after 10 minutes whether or not the mentor was done.** A careful mentor still typing at minute 11 could have a second mentor start the same team. Only one submission is accepted, so one of them would lose everything they'd typed. Fix: while the form is open, the phone renews the lock every 30 seconds (and again when the screen wakes). The 10-minute expiry now only applies once a mentor has actually left. That is also what the 95-minute lock had been.
- **A locked team could still be opened.** Lists showed "Being checked", but tapping it went to the team page anyway. Fix: locked teams show 🔒 and the mentor's name and don't open. If a mentor's lock is taken over while their phone sleeps, their form now says who has the team and keeps their answers on the phone.

**Lesson:** time-based locks need a heartbeat, or they'll expire right when someone needs them most.

## 1:10 AM — Table 4 and table 4

> "Swap data from team A to team B. The mentor entered the wrong one."

Team A was at **Upper · Table 4**. Team B was at **Lower · Table 4**. A mentor at table 4 searched, saw a team at "table 4", and filed their check-in there. The floor label we added at 10 PM was on screen, but table numbers repeated across floors.

Fixing it wasn't one click: the check-in had also created a help request, and the right team already had an "away" mark from another mentor's real visit. We added a **Move** action that moves a check-in and the help requests it created to another team in one transaction, refuses if the target already has that round, and puts the original team back on everyone's due list.

**Lesson:** if two real places share a short name, the label people see has to make the difference obvious, or the data will say they're the same place.

---

## The bugs that were ours, not the app's

To be complete: a few failures were in our tooling, not the product.

- **Auto-approval refused production writes.** That was right. The wipe and the import ran only after a human said "go ahead".
- **Screenshot scripts** loaded the page before setting the mentor's sign-in, so the first screenshot showed the sign-up screen. They also used an ES-module script that ignored `NODE_PATH`, and a Playwright version that wanted a browser we didn't have.
- **A shell `echo`** turned a mentor's line break into a raw control character, and our JSON check reported it as a bug in the API. It wasn't.

## What we'd do the same way next time

- **Back up before every destructive action.** Eight backups that night, none restored in anger, which is the point.
- **Test on a copy of the real data.** Restoring a live backup into a local database and loading a real mentor's screen answered more questions than any amount of reading the code.
- **Use the production database path in tests.** It's where the crash was.
- **Write down what you couldn't confirm.** Several fixes went out as "these three things can cause what you saw". That was more useful, and more honest, than claiming to have found the one cause.

The hackathon kept running all night. Every fix above was deployed between check-ins, with mentors' phones in their hands.
