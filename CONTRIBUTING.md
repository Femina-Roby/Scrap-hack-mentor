# Contributing to Mentor Desk

Thanks for helping! Mentor Desk is small on purpose: plain JavaScript, no framework, no build step. Please keep it that way.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000 · /admin password: admin
npm test        # end-to-end walk-through of a whole event
```

Setup → **Load practice data** gives you dummy teams to click around with. Open `/` in a phone-sized window (or on your phone on the same Wi-Fi) for the mentor app.

## Guidelines

- **Mentors are busy and on their feet.** Mentor screens get one main button and as few choices as possible. New mentor-facing features should earn their place; organizer features go in `/admin`.
- **Event-specific things go in the config**, not the code. If you're adding a question, label or time, it belongs in a preset (see [docs/CONFIG.md](docs/CONFIG.md)).
- **The database must stay compatible with backups.** New columns go at the end of the schema in `lib/db.js` as `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, and must be nullable.
- **Match the surrounding code**: small functions, short comments that say *why*, no new dependencies unless they're essential.
- Run `npm test` before opening a pull request, and say in the PR how you tried it (phone, admin, which preset).

## Reporting bugs

Open an issue with what you did, what you expected, what happened, and which preset/config you use. For anything security-related, see [SECURITY.md](SECURITY.md) instead.
