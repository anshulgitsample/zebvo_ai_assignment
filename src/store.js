import { create } from 'zustand';

// ── helpers ──────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const persist = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

// ── auth store ────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: load('bf_user', null),
  login: (email, name) => {
    const user = { id: uid(), email, name, createdAt: now() };
    persist('bf_user', user);
    set({ user });
  },
  logout: () => { localStorage.removeItem('bf_user'); set({ user: null }); },
}));

// ── workspace store ───────────────────────────────────────
const defaultWorkspaces = [
  { id: 'ws1', name: 'My Brand', industry: 'Technology', tone: 'professional', description: 'A tech startup building the future', color: '#4f7cff', createdAt: now() },
];

export const useWorkspaceStore = create((set, get) => ({
  workspaces: load('bf_workspaces', defaultWorkspaces),
  activeId: load('bf_activeWs', 'ws1'),

  getActive: () => get().workspaces.find(w => w.id === get().activeId),

  setActive: (id) => { persist('bf_activeWs', id); set({ activeId: id }); },

  addWorkspace: (data) => {
    const ws = { id: uid(), ...data, createdAt: now() };
    const updated = [...get().workspaces, ws];
    persist('bf_workspaces', updated);
    set({ workspaces: updated, activeId: ws.id });
    persist('bf_activeWs', ws.id);
    return ws;
  },

  updateWorkspace: (id, data) => {
    const updated = get().workspaces.map(w => w.id === id ? { ...w, ...data } : w);
    persist('bf_workspaces', updated);
    set({ workspaces: updated });
  },

  deleteWorkspace: (id) => {
    const updated = get().workspaces.filter(w => w.id !== id);
    persist('bf_workspaces', updated);
    const newActive = updated[0]?.id || null;
    persist('bf_activeWs', newActive);
    set({ workspaces: updated, activeId: newActive });
  },
}));

// ── content store ─────────────────────────────────────────
export const useContentStore = create((set, get) => ({
  items: load('bf_content', []),

  getByWorkspace: (wsId) => get().items.filter(c => c.workspaceId === wsId),

  addItem: (item) => {
    const newItem = { id: uid(), ...item, createdAt: now(), updatedAt: now() };
    const updated = [newItem, ...get().items];
    persist('bf_content', updated);
    set({ items: updated });
    return newItem;
  },

  updateItem: (id, data) => {
    const updated = get().items.map(i => i.id === id ? { ...i, ...data, updatedAt: now() } : i);
    persist('bf_content', updated);
    set({ items: updated });
  },

  deleteItem: (id) => {
    const updated = get().items.filter(i => i.id !== id);
    persist('bf_content', updated);
    set({ items: updated });
  },
}));

// ── schedule store ────────────────────────────────────────
export const useScheduleStore = create((set, get) => ({
  scheduled: load('bf_schedule', []),

  add: (entry) => {
    const updated = [...get().scheduled, { id: uid(), ...entry, createdAt: now() }];
    persist('bf_schedule', updated);
    set({ scheduled: updated });
  },

  remove: (id) => {
    const updated = get().scheduled.filter(s => s.id !== id);
    persist('bf_schedule', updated);
    set({ scheduled: updated });
  },

  update: (id, data) => {
    const updated = get().scheduled.map(s => s.id === id ? { ...s, ...data } : s);
    persist('bf_schedule', updated);
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
