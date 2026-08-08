import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { promisify } from 'util';
import pg from 'pg';
import Stripe from 'stripe';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_FILE = join(__dirname, 'users.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Database ─────────────────────────────────────────────────────────────────
// Uses PostgreSQL when DATABASE_URL is set (Railway production),
// falls back to users.json for local dev.

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      email                TEXT UNIQUE NOT NULL,
      password_hash        TEXT NOT NULL,
      created_at           BIGINT NOT NULL,
      progress             JSONB,
      reset_token          TEXT,
      reset_token_expires  BIGINT
    )
  `).then(async () => {
    // Add reset columns if they don't exist yet (for existing tables)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires BIGINT`).catch(() => {});
    // Billing. Nullable throughout: every existing row is a free account.
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_until BIGINT`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS typed_chats JSONB`).catch(() => {});
    console.log('PostgreSQL ready');
  }).catch(err => console.error('DB init error:', err.message));
}

// ── Storage helpers ───────────────────────────────────────────────────────────

// ── Passwords and session tokens ─────────────────────────────────────────────
//
// Two problems this replaces:
//
//   1. Passwords were a single unsalted SHA-256 round with a constant suffix.
//      SHA-256 is built to be fast, so a leaked table is a few GPU-hours away
//      from being plaintext, and identical passwords produced identical hashes.
//      Now: scrypt, per-user random salt.
//
//   2. The auth token *was* that hash. So a leaked table didn't even need
//      cracking — every row was a working login — and there was no way to
//      revoke a stolen token short of making the user change their password.
//      Now: an HMAC-signed token that expires, and that stops verifying the
//      moment the account's password changes.
//
// Both are backward compatible on purpose: existing rows verify and are
// upgraded on the owner's next login, and tokens already sitting in people's
// browsers keep working. See verifyPassword / getAuthUser below.

const scryptAsync = promisify(crypto.scrypt);

// N=16384 needs 128*N*r = 16 MB, which fits under Node's 32 MB scrypt default.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

// Signs tokens, and keeps the old SHA-256 hashes out of the database once an
// account is upgraded (see stampLegacy). Setting TOKEN_SECRET in the
// environment is strongly preferred; the fallback only exists so that a deploy
// without it keeps working instead of logging everyone out. It has to be stable
// across restarts, so it can't be random.
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.createHash('sha256')
  .update('lumi-token-v1|' + (process.env.DATABASE_URL || process.env.ANTHROPIC_API_KEY || 'local-dev'))
  .digest('hex');
if (!process.env.TOKEN_SECRET) {
  console.warn('TOKEN_SECRET is not set — falling back to a derived secret. Set it to a random 32+ byte value.');
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

/** Constant-time compare for two hex strings of any length. */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function hmac(data) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
}

/** The original scheme. Kept only to verify (and retire) pre-existing rows. */
function legacyHash(password) {
  return crypto.createHash('sha256').update(password + 'linguo-salt').digest('hex');
}

/**
 * Lets a token minted under the old scheme keep working after the account is
 * upgraded, without leaving the crackable SHA-256 in the database — the stored
 * value is keyed by TOKEN_SECRET, which lives in the environment.
 */
function stampLegacy(sha256Hex) {
  return hmac('legacy|' + sha256Hex);
}

/** `s2$N$r$p$salt$key$legacyStamp` — the last field is empty for new accounts. */
async function hashPassword(password, legacyStamp = '') {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['s2', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt, key.toString('hex'), legacyStamp].join('$');
}

/** → { ok, needsUpgrade }. needsUpgrade means the row is still on SHA-256. */
async function verifyPassword(password, stored) {
  if (!stored) return { ok: false, needsUpgrade: false };
  if (stored.startsWith('s2$')) {
    const [, N, r, p, salt, key] = stored.split('$');
    const derived = await scryptAsync(password, salt, key.length / 2, { N: +N, r: +r, p: +p });
    return { ok: safeEqual(derived.toString('hex'), key), needsUpgrade: false };
  }
  return { ok: safeEqual(legacyHash(password), stored), needsUpgrade: true };
}

const b64url = s => Buffer.from(s, 'utf8').toString('base64url');

/**
 * Binding the signature to the stored password hash is what makes a password
 * change (or reset) invalidate every token issued before it.
 */
function pwStamp(storedHash) {
  return hmac('pw|' + storedHash).slice(0, 32);
}

function issueToken(email, storedHash) {
  const payload = b64url(JSON.stringify({ e: email, iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${hmac(payload + '|' + pwStamp(storedHash))}`;
}

// Email is the account key, so it has to be compared case-insensitively.
// Without this, signing up as Sam@x.com and later typing sam@x.com created a
// second, empty account and the first one's progress looked lost.
function normEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

/** Find a key in the JSON-file store regardless of the case it was saved in. */
function findUserKey(users, email) {
  const target = normEmail(email);
  return Object.keys(users).find(k => normEmail(k) === target);
}

// File-based fallbacks (local dev only)
function loadUsers() {
  if (!existsSync(USERS_FILE)) return {};
  return JSON.parse(readFileSync(USERS_FILE, 'utf8'));
}
function saveUsers(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * → { email, storedHash } or null. The email returned is always the spelling
 * stored on the row, so callers can key off it directly.
 */
async function findUserByEmail(email) {
  const target = normEmail(email);
  if (pool) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [target]);
    const u = rows[0];
    return u ? { email: u.email, storedHash: u.password_hash } : null;
  }
  const users = loadUsers();
  const key = findUserKey(users, target);
  return key ? { email: users[key].email ?? key, storedHash: users[key].passwordHash } : null;
}

// Resolve auth from a Bearer token → { email, storedHash } or null.
//
// Two formats are accepted. `payload.signature` is the current one. Anything
// else is a token minted before the rewrite — base64("email:sha256hash") — and
// is still honoured so that nobody is signed out by the upgrade. Base64 has no
// '.' in its alphabet, so the two can't be confused.
async function getAuthUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    return token.includes('.') ? await verifySessionToken(token) : await verifyLegacyToken(token);
  } catch { return null; }
}

async function verifySessionToken(token) {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!claims?.e || !(claims.exp > Date.now())) return null;

  const user = await findUserByEmail(claims.e);
  if (!user) return null;
  // Recomputed from the *current* password hash, so a password change or reset
  // silently retires every token handed out before it.
  if (!safeEqual(sig, hmac(payload + '|' + pwStamp(user.storedHash)))) return null;
  return user;
}

async function verifyLegacyToken(token) {
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  const colonIdx = decoded.indexOf(':');
  if (colonIdx < 0) return null;
  const presented = decoded.slice(colonIdx + 1);

  const user = await findUserByEmail(decoded.slice(0, colonIdx));
  if (!user?.storedHash) return null;

  if (user.storedHash.startsWith('s2$')) {
    // Already upgraded — the row keeps an HMAC of the retired hash so old
    // tokens stay valid without the crackable original sitting in the table.
    const stamp = user.storedHash.split('$')[6];
    if (!stamp || !safeEqual(stamp, stampLegacy(presented))) return null;
    return user;
  }
  if (!safeEqual(user.storedHash, presented)) return null;
  return user;
}

/** Move a still-on-SHA-256 account to scrypt. Called after a successful login. */
async function upgradeStoredHash(email, password, oldHash) {
  const upgraded = await hashPassword(password, stampLegacy(oldHash));
  if (pool) {
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [upgraded, email]);
  } else {
    const users = loadUsers();
    const key = findUserKey(users, email);
    if (key) { users[key].passwordHash = upgraded; saveUsers(users); }
  }
  return upgraded;
}

// ── Plans ────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = normEmail(process.env.ADMIN_EMAIL ?? 'elliot@themaclan.com');

// Who can reach the upgrade flow at all. Stripe is running on test keys, so a
// real visitor who tried to pay would just get declined and conclude the site
// is broken — the checkout stays invisible to everyone else until it goes live.
const BETA_EMAILS = new Set([ADMIN_EMAIL]);
const hasBetaAccess = email => BETA_EMAILS.has(normEmail(email));

const LIMITS = {
  free: { tutorPerHour: 120, customizePerHour: 12, typedChatsPerDay: 5,  units: '4–5'  },
  pro:  { tutorPerHour: 600, customizePerHour: 60, typedChatsPerDay: Infinity, units: '9–10' },
};

/** 'pro' only while the subscription is actually live. */
function planOf(row) {
  if (!row) return 'free';
  const until = Number(row.plan_until ?? row.planUntil ?? 0);
  const plan = row.plan ?? 'free';
  if (plan !== 'pro') return 'free';
  // Stripe tells us when it lapses; the timestamp is the backstop if a
  // cancellation webhook is ever missed.
  if (until && until < Date.now()) return 'free';
  return 'pro';
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Free accounts get five *typed* tutor questions a day. The tip that fires
 * automatically after every answer is not counted — there are about thirteen
 * per lesson, so counting those would spend the whole allowance before the
 * first lesson ended.
 */
function countTypedToday(row) {
  const rec = row?.typed_chats ?? row?.typedChats;
  if (!rec || rec.date !== todayStr()) return 0;
  return Number(rec.count) || 0;
}

async function bumpTypedToday(email, row) {
  const next = { date: todayStr(), count: countTypedToday(row) + 1 };
  await writeUserFields(email, pool ? { typed_chats: next } : { typedChats: next });
  return next.count;
}

async function readUserRow(email) {
  const target = normEmail(email);
  if (pool) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [target]);
    return rows[0] ?? null;
  }
  const users = loadUsers();
  const key = findUserKey(users, target);
  return key ? users[key] : null;
}

async function writeUserFields(email, fields) {
  if (pool) {
    const keys = Object.keys(fields);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await pool.query(
      `UPDATE users SET ${sets} WHERE LOWER(email) = $${keys.length + 1}`,
      [...keys.map(k => fields[k]), normEmail(email)],
    );
  } else {
    const users = loadUsers();
    const key = findUserKey(users, email);
    if (!key) return;
    Object.assign(users[key], fields);
    saveUsers(users);
  }
}

// ── Stripe ───────────────────────────────────────────────────────────────────
// Absent keys are not an error: the endpoints answer 503 and the client hides
// the upgrade entry point, so the app runs exactly as before without them.

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

if (stripe && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && process.env.ALLOW_LIVE_STRIPE !== 'yes') {
  // Refusing to boot beats discovering the mix-up because a real card was
  // charged. Set ALLOW_LIVE_STRIPE=yes deliberately when going live.
  console.error('Refusing to start: STRIPE_SECRET_KEY is a live key but ALLOW_LIVE_STRIPE is not set to "yes".');
  process.exit(1);
}

const PRO_PRICE_CENTS = 800;   // $8/mo placeholder — change here and in Stripe

/**
 * The only place a plan is granted or revoked. Never trust the browser coming
 * back from Checkout with "?checkout=success" — that URL is just a URL, and
 * anyone can visit it.
 */
async function handleStripeEvent(event) {
  const obj = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const email = normEmail(obj.metadata?.lumiEmail || obj.customer_email);
    if (!email) return;
    // The session says paid; the subscription says how long for.
    let until = 0;
    if (obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      until = (sub.current_period_end ?? 0) * 1000;
    }
    await writeUserFields(email, pool
      ? { plan: 'pro', plan_until: until || null, stripe_customer_id: obj.customer ?? null, stripe_subscription_id: obj.subscription ?? null }
      : { plan: 'pro', planUntil: until || null, stripeCustomerId: obj.customer ?? null, stripeSubscriptionId: obj.subscription ?? null });
    console.log(`stripe: ${email} is now pro`);
    return;
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const email = await emailForCustomer(obj.customer);
    if (!email) return;
    // 'active' and 'trialing' are the only states that should keep the perks.
    const live = event.type !== 'customer.subscription.deleted'
      && (obj.status === 'active' || obj.status === 'trialing');
    const until = (obj.current_period_end ?? 0) * 1000;
    await writeUserFields(email, pool
      ? { plan: live ? 'pro' : 'free', plan_until: live ? until || null : null }
      : { plan: live ? 'pro' : 'free', planUntil: live ? until || null : null });
    console.log(`stripe: ${email} -> ${live ? 'pro' : 'free'} (${obj.status})`);
  }
}

/** Subscription events carry a customer id, not an address. */
async function emailForCustomer(customerId) {
  if (!customerId) return null;
  if (pool) {
    const { rows } = await pool.query('SELECT email FROM users WHERE stripe_customer_id = $1', [customerId]);
    if (rows[0]) return rows[0].email;
  } else {
    const users = loadUsers();
    const hit = Object.values(users).find(u => u.stripeCustomerId === customerId);
    if (hit) return hit.email;
  }
  // Not linked yet (first event can race the checkout row) — ask Stripe
  try {
    const cust = await stripe.customers.retrieve(customerId);
    return normEmail(cust?.metadata?.lumiEmail || cust?.email) || null;
  } catch { return null; }
}

// ── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

// Before express.json(). Stripe signs the raw bytes, and a parsed body fails
// verification every time — this ordering is the whole trick.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).end();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('stripe webhook signature rejected:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    // 500 makes Stripe retry, which is what we want if our DB was briefly down
    console.error('stripe webhook handler failed:', event.type, err.message);
    return res.status(500).end();
  }
  res.json({ received: true });
});

app.use(express.json());

// Serve the built Vite frontend in production
const distPath = join(__dirname, '../dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, password } = req.body;
  const email = normEmail(req.body.email);
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (String(password).length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
  }

  const ph = await hashPassword(password);
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  if (pool) {
    try {
      // Catches legacy rows stored with different capitalisation
      const { rows: existing } = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email]);
      if (existing[0]) return res.status(409).json({ error: 'Email already registered' });
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1,$2,$3,$4,$5)',
        [id, name, email, ph, createdAt]
      );
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    const users = loadUsers();
    if (findUserKey(users, email)) return res.status(409).json({ error: 'Email already registered' });
    users[email] = { id, name, email, passwordHash: ph, createdAt };
    saveUsers(users);
  }

  res.json({ user: { id, name, email, createdAt }, token: issueToken(email, ph) });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  const email = normEmail(req.body.email);
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  if (pool) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
    const user = rows[0];
    const check = await verifyPassword(password, user?.password_hash);
    if (!user || !check.ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // A correct password is the only moment we can re-hash it, so take it.
    const stored = check.needsUpgrade
      ? await upgradeStoredHash(user.email, password, user.password_hash)
      : user.password_hash;
    return res.json({
      // The token is built from the stored spelling, not what was typed
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
      token: issueToken(user.email, stored),
    });
  } else {
    const users = loadUsers();
    const key = findUserKey(users, email);
    const user = key ? users[key] : null;
    const check = await verifyPassword(password, user?.passwordHash);
    if (!user || !check.ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const stored = check.needsUpgrade
      ? await upgradeStoredHash(user.email ?? key, password, user.passwordHash)
      : user.passwordHash;
    const { passwordHash: _, resetToken: __, resetTokenExpires: ___, ...safe } = user;
    return res.json({ user: safe, token: issueToken(user.email ?? key, stored) });
  }
});

// Admin — list all users (only accessible by elliot@themaclan.com)
app.get('/api/admin/users', async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth || normEmail(auth.email) !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

  if (pool) {
    const { rows } = await pool.query(
      `SELECT id, name, email, created_at,
              (progress->>'xp')::int        AS xp,
              (progress->>'streak')::int    AS streak,
              progress->>'lastSessionDate'  AS last_session
       FROM users ORDER BY created_at DESC`
    );
    return res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      createdAt: new Date(Number(r.created_at)).toISOString(),
      xp: r.xp ?? 0,
      streak: r.streak ?? 0,
      lastSession: r.last_session ?? null,
    })));
  }

  // Local fallback
  const users = loadUsers();
  return res.json(Object.values(users).map(u => ({
    id: u.id, name: u.name, email: u.email,
    createdAt: u.created_at ? new Date(u.created_at).toISOString() : null,
    xp: u.progress?.xp ?? 0, streak: u.progress?.streak ?? 0,
    lastSession: u.progress?.lastSessionDate ?? null,
  })));
});

// Progress — GET returns saved progress, POST saves it
app.get('/api/progress', async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  if (pool) {
    const { rows } = await pool.query('SELECT progress FROM users WHERE email = $1', [auth.email]);
    return res.json(rows[0]?.progress ?? null);
  } else {
    const users = loadUsers();
    const key = findUserKey(users, auth.email);
    return res.json((key ? users[key].progress : null) ?? null);
  }
});

app.post('/api/progress', async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  if (pool) {
    await pool.query(
      'UPDATE users SET progress = $1 WHERE email = $2',
      [req.body, auth.email]
    );
  } else {
    const users = loadUsers();
    const key = findUserKey(users, auth.email);
    if (!key) return res.status(401).json({ error: 'Unauthorized' });
    users[key].progress = req.body;
    saveUsers(users);
  }
  res.json({ ok: true });
});

// Who am I and what do I get — the client renders from this, the server enforces it
app.get('/api/me', async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const row = await readUserRow(auth.email);
  const plan = planOf(row);
  res.json({
    email: auth.email,
    plan,
    // Without a key there is nothing to upgrade to, so the button stays hidden
    betaAccess: hasBetaAccess(auth.email) && !!stripe,
    limits: { typedChatsPerDay: LIMITS[plan].typedChatsPerDay === Infinity ? null : LIMITS[plan].typedChatsPerDay },
    typedChatsToday: countTypedToday(row),
  });
});

app.post('/api/stripe/checkout', async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Please sign in first.' });
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured.' });
  if (!hasBetaAccess(auth.email)) return res.status(403).json({ error: 'Pro is not open yet.' });

  const row = await readUserRow(auth.email);
  if (planOf(row) === 'pro') return res.status(409).json({ error: 'You are already on Pro.' });

  const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: row?.stripe_customer_id ?? row?.stripeCustomerId ?? undefined,
      customer_email: (row?.stripe_customer_id ?? row?.stripeCustomerId) ? undefined : auth.email,
      // The webhook reads this back — it is the only link from a payment to an account
      metadata: { lumiEmail: auth.email },
      subscription_data: { metadata: { lumiEmail: auth.email } },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: PRO_PRICE_CENTS,
          recurring: { interval: 'month' },
          product_data: { name: 'Lumi Pro', description: 'Unlimited tutor chat, 10-unit courses, offline lessons, higher AI limits' },
        },
      }],
      success_url: `${origin}/profile?checkout=success`,
      cancel_url: `${origin}/profile?checkout=cancelled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('stripe checkout failed:', err.message);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
});

// Cancel / update card, hosted by Stripe. Also how a test subscription gets
// cancelled so the downgrade webhook can be exercised.
app.post('/api/stripe/portal', async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Please sign in first.' });
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured.' });
  const row = await readUserRow(auth.email);
  const customer = row?.stripe_customer_id ?? row?.stripeCustomerId;
  if (!customer) return res.status(404).json({ error: 'No billing account yet.' });
  const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
  try {
    const portal = await stripe.billingPortal.sessions.create({ customer, return_url: `${origin}/profile` });
    res.json({ url: portal.url });
  } catch (err) {
    console.error('stripe portal failed:', err.message);
    res.status(500).json({ error: 'Could not open billing. Please try again.' });
  }
});

// Forgot password — generate token and send email via Resend
app.post('/api/auth/forgot-password', async (req, res) => {
  const email = normEmail(req.body.email);
  if (!email) return res.status(400).json({ error: 'Email required' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour

  if (pool) {
    const { rows } = await pool.query('SELECT email FROM users WHERE LOWER(email) = $1', [email]);
    if (!rows[0]) return res.json({ ok: true }); // Don't reveal if email exists
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, rows[0].email]
    );
  } else {
    const users = loadUsers();
    const key = findUserKey(users, email);
    if (!key) return res.json({ ok: true });
    users[key].resetToken = token;
    users[key].resetTokenExpires = expires;
    saveUsers(users);
  }

  const resetUrl = `${process.env.APP_URL || 'https://lumilanguage.up.railway.app'}/?reset=${token}`;

  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Lumi <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your Lumi password',
        html: `<p>Hi! Click the link below to reset your Lumi password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      }),
    }).catch(err => console.error('Email send error:', err.message));
  } else {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
  }

  res.json({ ok: true });
});

// Reset password — validate token and update password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (String(password).length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
  }

  // No legacy stamp: resetting a password should invalidate old sessions.
  const newHash = await hashPassword(password);

  if (pool) {
    const { rows } = await pool.query(
      'SELECT email FROM users WHERE reset_token = $1 AND reset_token_expires > $2',
      [token, Date.now()]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired reset link' });
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE email = $2',
      [newHash, rows[0].email]
    );
    return res.json({ ok: true });
  } else {
    const users = loadUsers();
    const user = Object.values(users).find(u => u.resetToken === token && u.resetTokenExpires > Date.now());
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    const key = findUserKey(users, user.email);
    users[key].passwordHash = newHash;
    users[key].resetToken = null;
    users[key].resetTokenExpires = null;
    saveUsers(users);
    return res.json({ ok: true });
  }
});

// ── Abuse control for the paid endpoints ─────────────────────────────────────
// /api/tutor and /api/customize call Anthropic, so an open endpoint is a bill
// anyone on the internet can run up. Both now require a signed-in user, and the
// expensive one is capped per account.

/** Sliding-window counter. Returns true when the caller is over the limit. */
function overLimit(store, key, limit, windowMs) {
  const now = Date.now();
  const recent = (store.get(key) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  store.set(key, recent);
  if (store.size > 5000) {
    for (const [k, v] of store) if (!v.some(t => now - t < windowMs)) store.delete(k);
  }
  return false;
}

const tutorHits = new Map();      // email -> timestamps
const customizeHits = new Map();  // email -> timestamps

// AI Tutor (streaming)
app.post('/api/tutor', async (req, res) => {
  const { messages, systemPrompt, typed } = req.body;

  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Please sign in to use the tutor.' });

  const row = await readUserRow(auth.email);
  const plan = planOf(row);
  const limits = LIMITS[plan];

  if (overLimit(tutorHits, auth.email, limits.tutorPerHour, 3600_000)) {
    return res.status(429).json({ error: 'You have sent a lot of messages this hour — try again shortly.' });
  }

  // `typed` marks a question the learner actually wrote, as opposed to the
  // automatic tip after each answer. Only the former counts against the daily
  // allowance, and only for free accounts.
  if (typed && limits.typedChatsPerDay !== Infinity) {
    const used = countTypedToday(row);
    if (used >= limits.typedChatsPerDay) {
      return res.status(402).json({
        error: `You've used your ${limits.typedChatsPerDay} tutor questions for today. They reset tomorrow.`,
        reason: 'chat_limit',
      });
    }
    await bumpTypedToday(auth.email, row);
  }

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI tutor not configured' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // max_tokens caps thinking AND response text together. At 512 the model
    // could spend the whole budget thinking and emit no text at all — and since
    // only text_delta is forwarded below, that surfaced as an empty reply.
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// AI lesson customization
app.post('/api/customize', async (req, res) => {
  const { courseId, language, goal, level = 'beginner' } = req.body;
  if (!goal || !language) return res.status(400).json({ error: 'goal and language required' });
  if (typeof goal !== 'string' || goal.length > 600) {
    return res.status(400).json({ error: 'Keep your goal under 600 characters.' });
  }

  // A full curriculum is the most expensive call in the app — signed in only
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Please sign in to build a plan.' });
  const plan = planOf(await readUserRow(auth.email));
  const limits = LIMITS[plan];
  if (overLimit(customizeHits, auth.email, limits.customizePerHour, 3600_000)) {
    return res.status(429).json({ error: 'You have generated a lot of plans this hour — try again shortly.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI not configured' });

  const COLORS = ['#58CC02','#1CB0F6','#FF9600','#CE82FF','#FF4B4B','#00C4CC'];

  const isCJK = courseId === 'en-zh' || courseId === 'en-ja' || courseId === 'en-ko';
  const readingNote = courseId === 'en-zh'
    ? 'Add a "reading" field to each word with the pinyin pronunciation (e.g. "nǐ hǎo").'
    : courseId === 'en-ja'
    ? 'Add a "reading" field to each word with the romaji pronunciation (e.g. "konnichiwa").'
    : courseId === 'en-ko'
    ? 'Add a "reading" field to each word with the romanized pronunciation (e.g. "annyeonghaseyo").'
    : '';

  const systemPrompt = `You are a language curriculum designer. Given a learner's goal, create a highly practical, personalized ${language} lesson plan. Return ONLY valid JSON matching this exact schema, no markdown, no explanation:

{
  "units": [
    {
      "id": "u1",
      "title": "Unit 1",
      "subtitle": "short theme label",
      "emoji": "single emoji",
      "color": "#hex",
      "lessons": [
        {
          "id": "unique-kebab-id",
          "title": "Lesson Title",
          "emoji": "single emoji",
          "words": [
            { "english": "phrase in English", "target": "phrase in ${language}"${isCJK ? ', "reading": "pronunciation"' : ''} }
          ]
        }
      ]
    }
  ]
}

Rules:
- Create ${limits.units} units, each with 3–4 lessons
- Each lesson has 5–8 word/phrase pairs
- Phrases should be practical, full sentences or short phrases the learner will actually use
- Tailor everything tightly to the learner's stated goal — no generic vocabulary
- Unit colors must come from this list: ${COLORS.join(', ')}
- All target language text must be accurate ${language}
- Keep lesson titles short (2–3 words)
- Learner experience level: ${level}. ${level === 'beginner' ? 'Use simple, short phrases. Avoid complex grammar. Prioritize survival vocabulary.' : level === 'intermediate' ? 'Use full sentences and introduce some grammar patterns. Learner knows basics already.' : 'Use natural, nuanced language. Include idiomatic expressions and complex structures.'}${readingNote ? '\n- ' + readingNote : ''}`;

  try {
    // A full curriculum is thousands of tokens, and thinking counts against the
    // same budget — 8000 could truncate the JSON mid-object, which surfaced as
    // "malformed JSON". Streaming so the larger budget can't hit an HTTP timeout.
    const response = await client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: `Course: ${courseId}\nLearner's goal: ${goal}\nExperience level: ${level}` }],
    }).finalMessage();

    if (response.stop_reason === 'max_tokens') {
      return res.status(500).json({ error: 'The plan was cut off before it finished. Please try again.' });
    }

    const text = response.content.find(b => b.type === 'text')?.text ?? '';
    const stripped = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'AI returned no JSON' });
    let plan;
    try {
      plan = JSON.parse(stripped.slice(start, end + 1));
    } catch (parseErr) {
      return res.status(500).json({ error: 'AI returned malformed JSON: ' + parseErr.message });
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Landing-page plan preview ────────────────────────────────────────────────
// Anonymous visitors get a taste of the curriculum generator before signing up.
// This endpoint spends real API credits for anyone who finds the URL, so it is
// deliberately much cheaper than /api/customize (one unit, not five) and capped
// per IP and per day.

const PREVIEW_PER_IP_PER_HOUR = 3;
const PREVIEW_PER_DAY = 300;
const previewHits = new Map();   // ip -> number[] of timestamps
let previewDay = { day: '', count: 0 };

function previewRateLimit(ip) {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  if (previewDay.day !== today) previewDay = { day: today, count: 0 };
  if (previewDay.count >= PREVIEW_PER_DAY) {
    return 'Lumi has hit its daily limit for free previews. Create an account to build your full plan.';
  }
  const recent = (previewHits.get(ip) ?? []).filter(t => now - t < 3600_000);
  if (recent.length >= PREVIEW_PER_IP_PER_HOUR) {
    return 'You have used your free previews for this hour. Create an account to build your full plan.';
  }
  recent.push(now);
  previewHits.set(ip, recent);
  previewDay.count++;
  // Keep the map from growing without bound on a long-running process
  if (previewHits.size > 5000) {
    for (const [k, v] of previewHits) {
      if (!v.some(t => now - t < 3600_000)) previewHits.delete(k);
    }
  }
  return null;
}

app.post('/api/preview-plan', async (req, res) => {
  const { courseId, language, goal } = req.body ?? {};
  if (!goal || !language) return res.status(400).json({ error: 'goal and language required' });
  if (typeof goal !== 'string' || goal.length > 300) {
    return res.status(400).json({ error: 'Keep your goal under 300 characters.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI not configured' });

  const ip = (req.headers['x-forwarded-for'] ?? '').toString().split(',')[0].trim() || req.ip || 'unknown';
  const limited = previewRateLimit(ip);
  if (limited) return res.status(429).json({ error: limited });

  const isCJK = courseId === 'en-zh' || courseId === 'en-ja' || courseId === 'en-ko';
  const systemPrompt = `You are a language curriculum designer. Given a learner's goal, design the FIRST unit of a personalized ${language} course. Return ONLY valid JSON, no markdown:

{
  "title": "unit title (2-4 words)",
  "subtitle": "one short line on what this unit gets them doing",
  "emoji": "single emoji",
  "lessons": [
    { "title": "Lesson Title", "emoji": "single emoji", "words": [ { "english": "phrase in English", "target": "phrase in ${language}"${isCJK ? ', "reading": "pronunciation"' : ''} } ] }
  ]
}

Rules:
- Exactly 3 lessons, each with exactly 3 word/phrase pairs
- Tailor everything tightly to the stated goal — no generic vocabulary
- Prefer whole phrases the learner will actually say over single words
- Assume a beginner
- All target language text must be accurate ${language}`;

  // Streamed, not awaited whole. This used to block on finalMessage(), so a
  // visitor watched a spinner for the entire generation and saw nothing until
  // the last character. Forwarding the deltas lets the page render each lesson
  // as it is written — the first one lands about a third of the way in.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Learner's goal: ${goal}` }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    // Whatever upstream says goes to the log, not to the visitor — this endpoint
    // is unauthenticated and the raw text carries request ids and key details.
    console.error('preview-plan failed:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Could not build a preview right now. Please try again.' })}\n\n`);
    res.end();
  }
});

// ── Per-language landing pages ───────────────────────────────────────────────
// The app is a client-rendered SPA, so a crawler that fetches /learn-japanese
// would otherwise receive the same generic <title> as every other route. Inject
// the real title and description server-side so these pages are indexable.

const LANDING_LANGS = {
  'learn-spanish':  { name: 'Spanish',  speakers: '500M+' },
  'learn-french':   { name: 'French',   speakers: '300M+' },
  'learn-chinese':  { name: 'Chinese',  speakers: '1B+'   },
  'learn-japanese': { name: 'Japanese', speakers: '125M+' },
  'learn-korean':   { name: 'Korean',   speakers: '80M+'  },
  'learn-german':   { name: 'German',   speakers: '100M+' },
  'learn-italian':  { name: 'Italian',  speakers: '65M+'  },
  'learn-portuguese': { name: 'Portuguese', speakers: '260M+' },
};

const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://lumilanguage.com';

app.get('/sitemap.xml', (_req, res) => {
  const urls = ['/', ...Object.keys(LANDING_LANGS).map(s => `/${s}`)];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${SITE_ORIGIN}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`,
  );
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
});

// Fall through to index.html for any non-API route (SPA)
// app.use (no path) works as a catch-all in Express 4 and 5
if (existsSync(distPath)) {
  const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf8');

  const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  app.use((req, res) => {
    const slug = req.path.replace(/^\/|\/$/g, '');
    const lang = LANDING_LANGS[slug];
    if (!lang) return res.sendFile(join(distPath, 'index.html'));

    const title = `Learn ${lang.name} with an AI tutor built around your goal · Lumi`;
    const desc = `Tell Lumi why you're learning ${lang.name} and get a curriculum built for that goal, with an AI tutor that explains the grammar mid-lesson. Free to start.`;
    const html = indexHtml.replace(
      /<title>.*?<\/title>/,
      `<title>${escapeHtml(title)}</title>\n    <meta name="description" content="${escapeHtml(desc)}" />` +
      `\n    <link rel="canonical" href="${SITE_ORIGIN}/${slug}" />` +
      `\n    <meta property="og:title" content="${escapeHtml(title)}" />` +
      `\n    <meta property="og:description" content="${escapeHtml(desc)}" />`,
    );
    res.type('html').send(html);
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
