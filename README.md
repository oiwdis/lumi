# Lumi

An AI language tutor. You tell Lumi why you're learning — moving to Madrid in
March, meeting your partner's family in Taipei — and it generates a curriculum
for that, with a tutor you can ask "why this ending?" without leaving the
exercise.

Live at [lumilanguage.com](https://lumilanguage.com).

Eight courses from English: Spanish, Chinese, French, Japanese, Korean, German,
Italian, Portuguese. Each has 32 topics of hand-written vocabulary as the
default path; a learner's stated goal replaces it with a generated one.

## Running it

```bash
npm install
npm run dev      # frontend on :5173
npm run server   # API on :3001 (the dev server proxies /api to it)
```

`npm run build` then `npm start` serves the built frontend from the API server,
which is how production runs.

### Environment

| variable | needed for |
| --- | --- |
| `ANTHROPIC_API_KEY` | the tutor and curriculum generation |
| `DATABASE_URL` | Postgres; without it accounts fall back to `server/users.json` |
| `RESEND_API_KEY` | password-reset emails; without it the link is logged to stdout |
| `APP_URL` | base URL used in reset links |
| `SITE_ORIGIN` | canonical/sitemap origin, defaults to `https://lumilanguage.com` |
| `ADMIN_EMAIL` | who may call `/api/admin/users` |

## Layout

```
src/
  components/   screens; ConversationScreen is the lesson engine
  data/         courses, vocabulary, lesson path, landing-page copy
  store/        zustand store, persisted to localStorage and synced to the API
  lib/          levels, auth header
server/index.js Express API: auth, progress, and the Anthropic endpoints
```

## Notes for anyone changing this

- `/api/tutor` and `/api/customize` cost money per call. Both require a
  signed-in user and are rate-limited per account. `/api/preview-plan` is the
  anonymous one behind the landing page — it generates a single unit and is
  capped per IP and per day.
- `max_tokens` on the Anthropic calls covers thinking *and* output. Setting it
  too low doesn't truncate the reply, it can produce an empty one.
- Vocabulary targets must be unique within a course. Distractors are drawn from
  the whole course, so a repeated string can render the same multiple-choice
  option twice.
- Course display names live in one `Record<CourseId, string>` in `data/index.ts`.
  Adding a language should fail to compile until every map is filled in.
- Passwords are SHA-256 with a static salt and the auth token is that hash.
  This wants replacing with argon2 and real session tokens; doing so invalidates
  every existing password, so it needs a migration.
