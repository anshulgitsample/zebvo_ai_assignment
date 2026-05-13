import { apiRequest, getAuthToken } from './api';

import { create } from 'zustand';

// ── helpers ──────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const persist = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

// ── auth store ────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: load('bf_user', null),
  token: getAuthToken(),

  signup: async (name, email, password) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('bf_token', data.token);
    persist('bf_user', data.user);
    set({ user: data.user, token: data.token });
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('bf_token', data.token);
    persist('bf_user', data.user);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('bf_token');
    localStorage.removeItem('bf_user');
    set({ user: null, token: null });
  },
}));

// ── workspace store ───────────────────────────────────────
export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeId: load('bf_activeWs', null),

  getActive: () => get().workspaces.find(w => w.id === get().activeId),

  setActive: (id) => { persist('bf_activeWs', id); set({ activeId: id }); },

  loadWorkspaces: async () => {
    const workspaces = await apiRequest('/workspaces');
    const activeId = get().activeId;
    const nextActive = workspaces.find(w => w.id === activeId)?.id || workspaces[0]?.id || null;
    persist('bf_activeWs', nextActive);
    set({ workspaces, activeId: nextActive });
  },

  addWorkspace: async (data) => {
    const ws = await apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const updated = [...get().workspaces, ws];
    persist('bf_activeWs', ws.id);
    set({ workspaces: updated, activeId: ws.id });
    return ws;
  },

  updateWorkspace: async (id, data) => {
    const ws = await apiRequest(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const updated = get().workspaces.map(w => w.id === id ? ws : w);
    set({ workspaces: updated });
  },

  deleteWorkspace: async (id) => {
    await apiRequest(`/workspaces/${id}`, { method: 'DELETE' });
    const updated = get().workspaces.filter(w => w.id !== id);
    const newActive = updated[0]?.id || null;
    persist('bf_activeWs', newActive);
    set({ workspaces: updated, activeId: newActive });
  },
}));

// ── content store ─────────────────────────────────────────
export const useContentStore = create((set, get) => ({
  items: [],

  getByWorkspace: (wsId) => get().items.filter(c => c.workspaceId === wsId),

  loadContent: async (workspaceId) => {
    if (!workspaceId) return;
    const items = await apiRequest(`/content?workspaceId=${workspaceId}`);
    set({ items });
  },

  addItem: async (item) => {
    const newItem = await apiRequest('/content', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    set({ items: [newItem, ...get().items] });
    return newItem;
  },

  updateItem: async (id, data) => {
    const updatedItem = await apiRequest(`/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const updated = get().items.map(i => i.id === id ? updatedItem : i);
    set({ items: updated });
  },

  deleteItem: async (id) => {
    await apiRequest(`/content/${id}`, { method: 'DELETE' });
    const updated = get().items.filter(i => i.id !== id);
    set({ items: updated });
  },
}));

// ── schedule store ────────────────────────────────────────
export const useScheduleStore = create((set, get) => ({
  scheduled: [],

  loadSchedule: async (workspaceId) => {
    if (!workspaceId) return;
    const scheduled = await apiRequest(`/schedule?workspaceId=${workspaceId}`);
    set({ scheduled });
  },

  add: async (entry) => {
    const newItem = await apiRequest('/schedule', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    set({ scheduled: [...get().scheduled, newItem] });
  },

  remove: async (id) => {
    await apiRequest(`/schedule/${id}`, { method: 'DELETE' });
    const updated = get().scheduled.filter(s => s.id !== id);
    set({ scheduled: updated });
  },

  update: async (id, data) => {
    const updatedItem = await apiRequest(`/schedule/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const updated = get().scheduled.map(s => s.id === id ? updatedItem : s);
    set({ scheduled: updated });
  },
}));

// ── toast store ───────────────────────────────────────────
export const useToastStore = create((set, get) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = uid();
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => set({ toasts: get().toasts.filter(t => t.id !== id) }), 3500);
  },
}));
