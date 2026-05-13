import { INDUSTRIES, TONES } from './aiService';
import { useContentStore, useToastStore, useWorkspaceStore } from './store';
import { useEffect, useState } from 'react';

const COLORS = ['#4f7cff','#7c5cfc','#00e5b0','#ffb347','#ff4d6a','#e1306c','#0a66c2','#1da1f2'];

export default function WorkspacesPage() {
  const { workspaces, loadWorkspaces, addWorkspace, updateWorkspace, deleteWorkspace, activeId, setActive } = useWorkspaceStore();
  const { getByWorkspace } = useContentStore();
  const toast = useToastStore(s => s.show);

  const [modal, setModal] = useState(null); // null | 'create' | workspace object
  const [form, setForm] = useState({ name: '', industry: 'Technology', tone: 'professional', description: '', color: COLORS[0] });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openCreate = () => { setForm({ name: '', industry: 'Technology', tone: 'professional', description: '', color: COLORS[0] }); setModal('create'); };
  const openEdit = (ws) => { setForm({ name: ws.name, industry: ws.industry, tone: ws.tone, description: ws.description || '', color: ws.color || COLORS[0] }); setModal(ws); };

  useEffect(() => {
    loadWorkspaces().catch(() => toast('Failed to load workspaces', 'error'));
  }, [loadWorkspaces, toast]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Workspace name required', 'error'); return; }
    try {
      if (modal === 'create') {
        await addWorkspace(form);
        toast('Workspace created!', 'success');
      } else {
        await updateWorkspace(modal.id, form);
        toast('Workspace updated!', 'success');
      }
      setModal(null);
    } catch (err) {
      toast(err.message || 'Workspace save failed', 'error');
    }
  };

  const handleDelete = async (ws) => {
    if (workspaces.length === 1) { toast("Can't delete your only workspace", 'error'); return; }
    try {
      await deleteWorkspace(ws.id);
      toast('Workspace deleted', 'info');
      setConfirmDelete(null);
    } catch (err) {
      toast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Workspaces</h1>
          <p className="page-subtitle">Manage your brand projects</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Workspace</button>
      </div>

      <div className="grid-3">
        {workspaces.map(ws => {
          const contentCount = getByWorkspace(ws.id).length;
          const isActive = ws.id === activeId;
          return (
            <div key={ws.id} className="card" style={{ borderColor: isActive ? ws.color || 'var(--accent)' : undefined, cursor: 'pointer', position: 'relative' }}
              onClick={() => setActive(ws.id)}>
              {isActive && (
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <span className="badge badge-green" style={{ fontSize: 11 }}>Active</span>
                </div>
              )}
              <div className="flex gap-3 items-center mb-3">
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${ws.color || 'var(--accent)'}22`, border: `1px solid ${ws.color || 'var(--accent)'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{ws.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{ws.industry}</div>
                </div>
              </div>

              {ws.description && (
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ws.description}</p>
              )}

              <div className="flex gap-3 mb-4">
                <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>{contentCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Content pieces</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>Tone</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{ws.tone}</div>
                </div>
              </div>

              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(ws)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(ws)}>🗑</button>
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, cursor: 'pointer', border: '1px dashed var(--border2)', background: 'transparent' }}
          onClick={openCreate}>
          <div style={{ fontSize: 36, marginBottom: 10, color: 'var(--text3)' }}>+</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text2)' }}>New Workspace</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Create a new brand project</div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'create' ? '✦ New Workspace' : 'Edit Workspace'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="field">
              <label className="label">Brand / Project Name *</label>
              <input className="input" placeholder="e.g. Acme Corp, My Store" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label">Industry</label>
                <select className="select" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Default Tone</label>
                <select className="select" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                  {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Brand Description</label>
              <textarea className="textarea" placeholder="What does this brand do? What makes it unique?" style={{ minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <label className="label">Brand Color</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : '2px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined, transition: 'var(--transition)' }} />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={handleSave}>{modal === 'create' ? 'Create Workspace' : 'Save Changes'}</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Workspace?</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>This will permanently delete <strong style={{ color: 'var(--text)' }}>{confirmDelete.name}</strong> and all its content. This cannot be undone.</p>
            <div className="flex gap-2">
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Yes, Delete</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
