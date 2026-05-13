const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';
const LOCAL_DB_KEY = 'bf_local_db';

const loadLocalDb = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DB_KEY)) || {
      users: [],
      workspaces: [],
      contents: [],
      schedules: [],
    };
  } catch {
    return { users: [], workspaces: [], contents: [], schedules: [] };
  }
};

const saveLocalDb = (db) => {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('bf_user')) || null;
  } catch {
    return null;
  }
};

const requireLocalUser = () => {
  const user = getLocalUser();
  if (!user) throw new Error('Missing token');
  return user;
};

const localRequest = (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const [rawPath, queryString] = path.split('?');
  const query = new URLSearchParams(queryString || '');
  const body = options.body ? JSON.parse(options.body) : null;
  const db = loadLocalDb();

  if (rawPath === '/auth/signup' && method === 'POST') {
    const { name, email, password } = body || {};
    if (!name || !email || !password) throw new Error('Missing fields');
    if (db.users.find(u => u.email === email)) throw new Error('Email already registered');
    const user = { id: uid(), name, email, password };
    db.users.push(user);
    saveLocalDb(db);
    return { token: 'local-token', user: { id: user.id, name: user.name, email: user.email } };
  }

  if (rawPath === '/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    if (!email || !password) throw new Error('Missing fields');
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    return { token: 'local-token', user: { id: user.id, name: user.name, email: user.email } };
  }

  if (rawPath === '/workspaces') {
    const user = requireLocalUser();
    if (method === 'GET') {
      return db.workspaces.filter(w => w.userId === user.id);
    }
    if (method === 'POST') {
      const { name, industry, tone, description, color } = body || {};
      if (!name || !industry || !tone) throw new Error('Missing fields');
      const workspace = {
        id: uid(),
        name,
        industry,
        tone,
        description: description || '',
        color: color || '#4f7cff',
        userId: user.id,
        createdAt: now(),
        updatedAt: now(),
      };
      db.workspaces.push(workspace);
      saveLocalDb(db);
      return workspace;
    }
  }

  if (rawPath?.startsWith('/workspaces/') && ['PATCH', 'DELETE'].includes(method)) {
    const user = requireLocalUser();
    const id = rawPath.split('/').pop();
    const idx = db.workspaces.findIndex(w => w.id === id && w.userId === user.id);
    if (idx === -1) throw new Error('Workspace not found');
    if (method === 'DELETE') {
      db.workspaces.splice(idx, 1);
      db.contents = db.contents.filter(c => c.workspaceId !== id || c.userId !== user.id);
      db.schedules = db.schedules.filter(s => s.workspaceId !== id || s.userId !== user.id);
      saveLocalDb(db);
      return { ok: true };
    }
    db.workspaces[idx] = { ...db.workspaces[idx], ...body, updatedAt: now() };
    saveLocalDb(db);
    return db.workspaces[idx];
  }

  if (rawPath === '/content') {
    const user = requireLocalUser();
    if (method === 'GET') {
      const workspaceId = query.get('workspaceId');
      return db.contents
        .filter(c => c.userId === user.id && (!workspaceId || c.workspaceId === workspaceId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (method === 'POST') {
      const required = ['workspaceId', 'contentType', 'platform', 'topic', 'tone', 'audience', 'content'];
      const missing = required.find(k => !body?.[k]);
      if (missing) throw new Error(`Missing ${missing}`);
      const item = {
        id: uid(),
        userId: user.id,
        workspaceId: body.workspaceId,
        contentType: body.contentType,
        platform: body.platform,
        topic: body.topic,
        tone: body.tone,
        audience: body.audience,
        content: body.content,
        imagePrompt: body.imagePrompt || null,
        createdAt: now(),
        updatedAt: now(),
      };
      db.contents.unshift(item);
      saveLocalDb(db);
      return item;
    }
  }

  if (rawPath?.startsWith('/content/') && ['PATCH', 'DELETE'].includes(method)) {
    const user = requireLocalUser();
    const id = rawPath.split('/').pop();
    const idx = db.contents.findIndex(c => c.id === id && c.userId === user.id);
    if (idx === -1) throw new Error('Content not found');
    if (method === 'DELETE') {
      db.contents.splice(idx, 1);
      saveLocalDb(db);
      return { ok: true };
    }
    db.contents[idx] = { ...db.contents[idx], ...body, updatedAt: now() };
    saveLocalDb(db);
    return db.contents[idx];
  }

  if (rawPath === '/schedule') {
    const user = requireLocalUser();
    if (method === 'GET') {
      const workspaceId = query.get('workspaceId');
      return db.schedules
        .filter(s => s.userId === user.id && (!workspaceId || s.workspaceId === workspaceId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (method === 'POST') {
      const required = ['workspaceId', 'topic', 'platform', 'date', 'time', 'status'];
      const missing = required.find(k => !body?.[k]);
      if (missing) throw new Error(`Missing ${missing}`);
      const item = {
        id: uid(),
        userId: user.id,
        workspaceId: body.workspaceId,
        contentId: body.contentId || null,
        topic: body.topic,
        platform: body.platform,
        date: body.date,
        time: body.time,
        status: body.status,
        createdAt: now(),
        updatedAt: now(),
      };
      db.schedules.push(item);
      saveLocalDb(db);
      return item;
    }
  }

  if (rawPath?.startsWith('/schedule/') && ['PATCH', 'DELETE'].includes(method)) {
    const user = requireLocalUser();
    const id = rawPath.split('/').pop();
    const idx = db.schedules.findIndex(s => s.id === id && s.userId === user.id);
    if (idx === -1) throw new Error('Schedule not found');
    if (method === 'DELETE') {
      db.schedules.splice(idx, 1);
      saveLocalDb(db);
      return { ok: true };
    }
    db.schedules[idx] = { ...db.schedules[idx], ...body, updatedAt: now() };
    saveLocalDb(db);
    return db.schedules[idx];
  }

  if (rawPath === '/analytics' && method === 'GET') {
    const user = requireLocalUser();
    const workspaceId = query.get('workspaceId');
    const items = db.contents.filter(c => c.userId === user.id && (!workspaceId || c.workspaceId === workspaceId));
    const byType = items.reduce((acc, item) => {
      acc[item.contentType] = (acc[item.contentType] || 0) + 1;
      return acc;
    }, {});
    const byTone = items.reduce((acc, item) => {
      acc[item.tone] = (acc[item.tone] || 0) + 1;
      return acc;
    }, {});
    return { total: items.length, byType, byTone };
  }

  throw new Error('API request failed');
};

export const getApiBase = () => API_BASE;

export const getAuthToken = () => localStorage.getItem('bf_token');

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    return localRequest(path, options);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (response.status === 401) {
    localStorage.removeItem('bf_token');
    localStorage.removeItem('bf_user');
  }

  if (!response.ok) {
    const message = data?.error || 'API request failed';
    throw new Error(message);
  }

  return data;
}
