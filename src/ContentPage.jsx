import { exportJSON, exportMarkdown, exportPDF, exportZIP } from './exportUtils';
import { useContentStore, useScheduleStore, useToastStore, useWorkspaceStore } from './store';

import { CONTENT_TYPES } from './aiService';
import { useState } from 'react';

export default function ContentPage() {
  const ws = useWorkspaceStore(s => s.getActive());
  const { getByWorkspace, updateItem, deleteItem } = useContentStore();
  const addSchedule = useScheduleStore(s => s.add);
  const toast = useToastStore(s => s.show);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('10:00');
  const [exportMenu, setExportMenu] = useState(false);

  if (!ws) return <div className="page"><div className="empty-state"><h3>No workspace selected</h3></div></div>;

  const items = getByWorkspace(ws.id);
  const filtered = items.filter(item => {
    if (filter !== 'all' && item.contentType !== filter) return false;
    if (search && !item.topic.toLowerCase().includes(search.toLowerCase()) && !item.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id) => {
    deleteItem(id);
    if (selected?.id === id) setSelected(null);
    toast('Content deleted', 'info');
  };

  const handleSaveEdit = () => {
    updateItem(selected.id, { content: editContent });
    setSelected({ ...selected, content: editContent });
    setEditMode(false);
    toast('Content updated!', 'success');
  };

  const handleSchedule = () => {
    if (!schedDate) { toast('Pick a date', 'error'); return; }
    addSchedule({ workspaceId: ws.id, contentId: scheduleModal.id, topic: scheduleModal.topic, platform: scheduleModal.contentType, date: schedDate, time: schedTime, status: 'scheduled' });
    setScheduleModal(null);
    toast('Post scheduled!', 'success');
  };

  const typeInfo = (id) => CONTENT_TYPES.find(t => t.id === id);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Content Library</h1>
          <p className="page-subtitle">{items.length} pieces for {ws.name}</p>
        </div>
        <div className="flex gap-2" style={{ position: 'relative' }}>
          <button className="btn btn-ghost" onClick={() => setExportMenu(!exportMenu)}>
            ↓ Export
          </button>
          {exportMenu && (
            <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10, padding: 8, zIndex: 100, minWidth: 180, boxShadow: 'var(--shadow)' }}>
              {[
                { label: '📄 Export as PDF', action: () => { if (selected) exportPDF(selected); else toast('Select an item first', 'error'); setExportMenu(false); } },
                { label: '📝 Export as Markdown', action: () => { if (selected) exportMarkdown(selected); else toast('Select an item first', 'error'); setExportMenu(false); } },
                { label: '📦 Export all as ZIP', action: async () => { await exportZIP(filtered, ws.name); setExportMenu(false); toast('ZIP downloaded!', 'success'); } },
                { label: '{ } Export as JSON', action: () => { exportJSON(filtered, ws.name); setExportMenu(false); toast('JSON downloaded!', 'success'); } },
              ].map(opt => (
                <button key={opt.label} className="nav-item" style={{ borderRadius: 6, fontSize: 13 }} onClick={opt.action}>{opt.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 240 }} placeholder="🔍 Search content..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs">
          <button className={`tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All ({items.length})</button>
          {CONTENT_TYPES.filter(t => items.some(i => i.contentType === t.id)).map(t => (
            <button key={t.id} className={`tab${filter === t.id ? ' active' : ''}`} onClick={() => setFilter(t.id)}>
              {t.icon} {t.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>📭</div>
          <h3>No content yet</h3>
          <p>Generate your first piece of content to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 20 }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => {
              const ti = typeInfo(item.contentType);
              return (
                <div key={item.id} className="content-item" style={{ borderColor: selected?.id === item.id ? 'var(--accent)' : undefined, background: selected?.id === item.id ? 'rgba(79,124,255,0.05)' : undefined }}
                  onClick={() => { setSelected(item); setEditMode(false); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 16 }}>{ti?.icon}</span>
                      <span className={`badge ${ti?.badge || 'badge-gray'}`} style={{ fontSize: 11 }}>{ti?.label}</span>
                    </div>
                    <button className="btn btn-danger btn-sm btn-icon" style={{ padding: '4px 6px', fontSize: 12 }}
                      onClick={e => { e.stopPropagation(); handleDelete(item.id); }}>✕</button>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }} className="truncate">{item.topic}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.content}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {item.tone}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="card" style={{ position: 'sticky', top: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>{typeInfo(selected.contentType)?.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{selected.topic}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{typeInfo(selected.contentType)?.label} · {selected.tone}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              {editMode ? (
                <>
                  <textarea className="textarea" value={editContent} onChange={e => setEditContent(e.target.value)} style={{ minHeight: 300, fontSize: 14, lineHeight: 1.7 }} />
                  <div className="flex gap-2 mt-3">
                    <button className="btn btn-success" onClick={handleSaveEdit}>Save Changes</button>
                    <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: 'var(--text)', maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                    {selected.content}
                  </div>
                  <div className="divider" />
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(true); setEditContent(selected.content); }}>✏️ Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(selected.content); toast('Copied!', 'success'); }}>📋 Copy</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setScheduleModal(selected)}>📅 Schedule</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => exportPDF(selected)}>↓ PDF</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => exportMarkdown(selected)}>↓ MD</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>🗑 Delete</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleModal && (
        <div className="modal-overlay" onClick={() => setScheduleModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📅 Schedule Post</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setScheduleModal(null)}>✕</button>
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text2)' }}>
              <strong style={{ color: 'var(--text)' }}>{scheduleModal.topic}</strong>
              <br />{typeInfo(scheduleModal.contentType)?.label}
            </div>
            <div className="field">
              <label className="label">Date</label>
              <input className="input" type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="field">
              <label className="label">Time</label>
              <input className="input" type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={handleSchedule}>Schedule Post</button>
              <button className="btn btn-ghost" onClick={() => setScheduleModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
