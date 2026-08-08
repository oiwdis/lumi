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
| `ADMIN_EMAIL` | who may call `/api/admin/users`, and the only account that can reach the upgrade flow |
| `TOKEN_SECRET` | signs session tokens; falls back to a value derived from `DATABASE_URL`, but set it |
| `STRIPE_SECRET_KEY` | Pro checkout; without it the upgrade flow is hidden and the app runs as before |
| `STRIPE_WEBHOOK_SECRET` | verifying Stripe webhooks — the only thing that grants or revokes Pro |
| `ALLOW_LIVE_STRIPE` | must be `yes` before the server will boot with an `sk_live_` key |

### Plans

Free accounts get twenty *typed* tutor questions a day — the automatic tip after
each answer is unlimited, since there are about thirteen per lesson. Pro lifts
that, generates ten-unit courses instead of five, raises the hourly AI limits,
and keeps lessons working offline.

Twenty is deliberately generous while Pro is unbuyable: throttling people costs
goodwill and earns nothing when nobody can upgrade to escape it. Drop
`FREE_TYPED_CHATS_PER_DAY` in `server/index.js` to 5 on the day Pro opens to
everyone — it is the only place the number lives.

Everyone sees the Pro pitch, but only `ADMIN_EMAIL` can reach checkout, and the
price is shown only to them; everyone else sees "coming soon". Stripe is on test
keys, and a real visitor pointed at test keys would be declined and would
reasonably conclude the site is broken. Going live is: swap the keys, set
`ALLOW_LIVE_STRIPE=yes`, register the production webhook endpoint, widen
`BETA_EMAILS` in `server/index.js`, and drop the free allowance to 5.

Webhooks are the only path that grants Pro — the browser returning from
Checkout with `?checkout=success` proves nothing. Locally:

```
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

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
