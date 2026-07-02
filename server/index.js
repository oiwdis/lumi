import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import pg from 'pg';

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
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at  BIGINT NOT NULL,
      progress    JSONB
    )
  `).then(() => console.log('PostgreSQL ready'))
    .catch(err => console.error('DB init error:', err.message));
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function hash(password) {
  return crypto.createHash('sha256').update(password + 'linguo-salt').digest('hex');
}

// File-based fallbacks (local dev only)
function loadUsers() {
  if (!existsSync(USERS_FILE)) return {};
  return JSON.parse(readFileSync(USERS_FILE, 'utf8'));
}
function saveUsers(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Resolve auth from Bearer token → { email, passwordHash } or null
async function getAuthUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const colonIdx = decoded.indexOf(':');
    const email = decoded.slice(0, colonIdx);
    const passwordHash = decoded.slice(colonIdx + 1);

    if (pool) {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1', [email]
      );
      const user = rows[0];
      if (!user || user.password_hash !== passwordHash) return null;
      return { email, passwordHash };
    } else {
      const users = loadUsers();
      const user = users[email];
      if (!user || user.passwordHash !== passwordHash) return null;
      return { email, passwordHash };
    }
  } catch { return null; }
}

// ── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Serve the built Vite frontend in production
const distPath = join(__dirname, '../dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  const ph = hash(password);
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  if (pool) {
    try {
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
    if (users[email]) return res.status(409).json({ error: 'Email already registered' });
    users[email] = { id, name, email, passwordHash: ph, createdAt };
    saveUsers(users);
  }

  const token = Buffer.from(`${email}:${ph}`).toString('base64');
  res.json({ user: { id, name, email, createdAt }, token });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const ph = hash(password);

  if (pool) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || user.password_hash !== ph) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = Buffer.from(`${email}:${ph}`).toString('base64');
    return res.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
      token,
    });
  } else {
    const users = loadUsers();
    const user = users[email];
    if (!user || user.passwordHash !== ph) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const { passwordHash: _, ...safe } = user;
    const token = Buffer.from(`${email}:${ph}`).toString('base64');
    return res.json({ user: safe, token });
  }
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
    return res.json(users[auth.email]?.progress ?? null);
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
    users[auth.email].progress = req.body;
    saveUsers(users);
  }
  res.json({ ok: true });
});

// AI Tutor (streaming)
app.post('/api/tutor', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI tutor not configured' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 512,
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

  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI not configured' });

  const COLORS = ['#58CC02','#1CB0F6','#FF9600','#CE82FF','#FF4B4B','#00C4CC'];

  const isCJK = courseId === 'en-zh' || courseId === 'en-ja';
  const readingNote = courseId === 'en-zh'
    ? 'Add a "reading" field to each word with the pinyin pronunciation (e.g. "nǐ hǎo").'
    : courseId === 'en-ja'
    ? 'Add a "reading" field to each word with the romaji pronunciation (e.g. "konnichiwa").'
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
- Create 4–5 units, each with 3–4 lessons
- Each lesson has 5–8 word/phrase pairs
- Phrases should be practical, full sentences or short phrases the learner will actually use
- Tailor everything tightly to the learner's stated goal — no generic vocabulary
- Unit colors must come from this list: ${COLORS.join(', ')}
- All target language text must be accurate ${language}
- Keep lesson titles short (2–3 words)
- Learner experience level: ${level}. ${level === 'beginner' ? 'Use simple, short phrases. Avoid complex grammar. Prioritize survival vocabulary.' : level === 'intermediate' ? 'Use full sentences and introduce some grammar patterns. Learner knows basics already.' : 'Use natural, nuanced language. Include idiomatic expressions and complex structures.'}${readingNote ? '\n- ' + readingNote : ''}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: `Course: ${courseId}\nLearner's goal: ${goal}\nExperience level: ${level}` }],
    });

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

// Fall through to index.html for any non-API route (SPA)
if (existsSync(distPath)) {
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
