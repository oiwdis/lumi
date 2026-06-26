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

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Lumi server running on http://localhost:${PORT}`));
