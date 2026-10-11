# Security

## Reporting a vulnerability

Please don't open a public issue. Use GitHub's private reporting instead: the repository's **Security** tab → **Report a vulnerability**. Include the details and steps to reproduce; we'll reply within a few days.

## Things to know when you run Mentor Desk

- **Set a strong `ADMIN_PASSWORD`.** It is the only thing protecting `/admin`, where every check-in, score and backup lives. The dashboard is locked if it isn't set (except locally without a database).
- **Mentor sign-in is a random token** stored in the mentor's browser. Anyone with that token can act as that mentor. Use `MENTOR_CODE` so strangers who find the link can't join.
- **Backups contain every mentor's token** and all participant data. Keep backup files private and delete them when you no longer need them.
- **Participant data** (names, colleges, notes about teams) is personal data. Only collect what you need, and wipe the database after the event if you don't need to keep it.
