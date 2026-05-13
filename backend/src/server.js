import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5050;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE_URLS = [
  'https://generativelanguage.googleapis.com/v1',
  'https://generativelanguage.googleapis.com/v1beta',
];
const GEMINI_PREFERRED_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.0-pro-latest',
];
let modelCache = null;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*'}));
app.use(express.json({ limit: '1mb' }));

const signToken = (user) => jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

const getAvailableModels = async () => {
  if (modelCache) return modelCache;
  const models = [];

  for (const baseUrl of GEMINI_BASE_URLS) {
    const response = await fetch(`${baseUrl}/models?key=${GEMINI_API_KEY}`);
    if (!response.ok) continue;
    const data = await response.json().catch(() => ({}));
    const items = Array.isArray(data.models) ? data.models : [];
    for (const item of items) {
      const name = item.name?.split('/').pop();
      if (!name) continue;
      models.push({
        name,
        baseUrl,
        methods: item.supportedGenerationMethods || [],
      });
    }
  }

  const byName = new Map(models.map((model) => [model.name, model]));
  const ordered = GEMINI_PREFERRED_MODELS.map((name) => byName.get(name)).filter(Boolean);
  modelCache = ordered.length ? ordered : models;
  return modelCache;
};

const selectModel = async (method) => {
  const models = await getAvailableModels();
  return models.find((model) => model.methods.includes(method));
};

const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Auth ────────────────────────────────────────────────
app.post('/auth/signup', async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) return res.status(400).json({ error: 'Missing fields' });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, password: hash } });
  return res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  return res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } });
});

// ── Workspaces ──────────────────────────────────────────
app.get('/workspaces', auth, async (req, res) => {
  const workspaces = await prisma.workspace.findMany({ where: { userId: req.user.sub } });
  res.json(workspaces);
});

app.post('/workspaces', auth, async (req, res) => {
  const { name, industry, tone, description, color } = req.body || {};
  if (!name || !industry || !tone) return res.status(400).json({ error: 'Missing fields' });
  const workspace = await prisma.workspace.create({
    data: { name, industry, tone, description: description || '', color: color || '#4f7cff', userId: req.user.sub },
  });
  res.json(workspace);
});

app.patch('/workspaces/:id', auth, async (req, res) => {
  const workspace = await prisma.workspace.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(workspace);
});

app.delete('/workspaces/:id', auth, async (req, res) => {
  await prisma.workspace.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Content ─────────────────────────────────────────────
app.get('/content', auth, async (req, res) => {
  const { workspaceId } = req.query;
  const items = await prisma.content.findMany({
    where: { userId: req.user.sub, ...(workspaceId ? { workspaceId } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

app.post('/content', auth, async (req, res) => {
  const data = req.body || {};
  const required = ['workspaceId', 'contentType', 'platform', 'topic', 'tone', 'audience', 'content'];
  const missing = required.find((k) => !data[k]);
  if (missing) return res.status(400).json({ error: `Missing ${missing}` });

  const item = await prisma.content.create({
    data: {
      workspaceId: data.workspaceId,
      userId: req.user.sub,
      contentType: data.contentType,
      platform: data.platform,
      topic: data.topic,
      tone: data.tone,
      audience: data.audience,
      content: data.content,
      imagePrompt: data.imagePrompt || null,
    },
  });
  res.json(item);
});

app.patch('/content/:id', auth, async (req, res) => {
  const item = await prisma.content.update({ where: { id: req.params.id }, data: req.body });
  res.json(item);
});

app.delete('/content/:id', auth, async (req, res) => {
  await prisma.content.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Scheduling ──────────────────────────────────────────
app.get('/schedule', auth, async (req, res) => {
  const { workspaceId } = req.query;
  const items = await prisma.schedule.findMany({
    where: { userId: req.user.sub, ...(workspaceId ? { workspaceId } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

app.post('/schedule', auth, async (req, res) => {
  const data = req.body || {};
  const required = ['workspaceId', 'topic', 'platform', 'date', 'time', 'status'];
  const missing = required.find((k) => !data[k]);
  if (missing) return res.status(400).json({ error: `Missing ${missing}` });

  const item = await prisma.schedule.create({
    data: {
      workspaceId: data.workspaceId,
      contentId: data.contentId || null,
      userId: req.user.sub,
      topic: data.topic,
      platform: data.platform,
      date: data.date,
      time: data.time,
      status: data.status,
    },
  });
  res.json(item);
});

app.patch('/schedule/:id', auth, async (req, res) => {
  const item = await prisma.schedule.update({ where: { id: req.params.id }, data: req.body });
  res.json(item);
});

app.delete('/schedule/:id', auth, async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Analytics ───────────────────────────────────────────
app.get('/analytics', auth, async (req, res) => {
  const { workspaceId } = req.query;
  const items = await prisma.content.findMany({
    where: { userId: req.user.sub, ...(workspaceId ? { workspaceId } : {}) },
  });

  const byType = items.reduce((acc, item) => {
    acc[item.contentType] = (acc[item.contentType] || 0) + 1;
    return acc;
  }, {});

  const byTone = items.reduce((acc, item) => {
    acc[item.tone] = (acc[item.tone] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total: items.length,
    byType,
    byTone,
  });
});

// ── Gemini relay (keeps API key server-side) ─────────────
app.post('/ai/generate', auth, async (req, res) => {
  if (!GEMINI_API_KEY) return res.status(400).json({ error: 'Missing GEMINI_API_KEY on server' });
  const { prompt, stream = false } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
  const model = await selectModel(endpoint);
  if (!model) return res.status(400).json({ error: 'No Gemini model available for this request' });

  const response = await fetch(
    `${model.baseUrl}/models/${model.name}:${endpoint}?key=${GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return res.status(response.status).json({ error: err.error?.message || 'Gemini request failed' });
  }

  if (!stream) {
    const data = await response.json();
    return res.json(data);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  response.body.on('data', (chunk) => res.write(chunk));
  response.body.on('end', () => res.end());
  response.body.on('error', () => res.end());
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
