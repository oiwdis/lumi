import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_FILE = join(__dirname, 'users.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Simple user store ────────────────────────────────────────────────────────

function loadUsers() {
  if (!existsSync(USERS_FILE)) return {};
  return JSON.parse(readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hash(password) {
  return crypto.createHash('sha256').update(password + 'linguo-salt').digest('hex');
}

// ── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  const users = loadUsers();
  if (users[email]) return res.status(409).json({ error: 'Email already registered' });

  const user = { id: crypto.randomUUID(), name, email, passwordHash: hash(password), createdAt: Date.now() };
  users[email] = user;
  saveUsers(users);

  const { passwordHash: _, ...safe } = user;
  res.json({ user: safe, token: Buffer.from(`${email}:${hash(password)}`).toString('base64') });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const users = loadUsers();
  const user = users[email];
  if (!user || user.passwordHash !== hash(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { passwordHash: _, ...safe } = user;
  res.json({ user: safe, token: Buffer.from(`${email}:${hash(password)}`).toString('base64') });
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
  const { courseId, language, goal } = req.body;
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
- Keep lesson titles short (2–3 words)${readingNote ? '\n- ' + readingNote : ''}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: `Course: ${courseId}\nLearner's goal: ${goal}` }],
    });

    const text = response.content.find(b => b.type === 'text')?.text ?? '';
    // Strip markdown code fences if present
    const stripped = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    // Find outermost JSON object
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

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Lumi server running on http://localhost:${PORT}`));
