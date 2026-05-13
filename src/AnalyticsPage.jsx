import { useContentStore, useScheduleStore, useWorkspaceStore } from './store';

import { CONTENT_TYPES } from './aiService';
import { useEffect } from 'react';

export default function AnalyticsPage() {
  const ws = useWorkspaceStore(s => s.getActive());
  const loadWorkspaces = useWorkspaceStore(s => s.loadWorkspaces);
  const { getByWorkspace, loadContent } = useContentStore();
  const { scheduled, loadSchedule } = useScheduleStore();

  useEffect(() => {
    loadWorkspaces().catch(() => {});
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!ws?.id) return;
    loadContent(ws.id).catch(() => {});
    loadSchedule(ws.id).catch(() => {});
  }, [ws?.id, loadContent, loadSchedule]);

  if (!ws) return <div className="page"><div className="empty-state"><h3>No workspace selected</h3></div></div>;

  const items = getByWorkspace(ws.id);
  const wsScheduled = scheduled.filter(s => s.workspaceId === ws.id);

  // Content by type
  const byType = CONTENT_TYPES.map(t => ({ ...t, count: items.filter(i => i.contentType === t.id).length }));
  const maxCount = Math.max(1, ...byType.map(t => t.count));

  // Content by day (last 14 days)
  const now = new Date();
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), key, count: items.filter(it => it.createdAt?.startsWith(key)).length };
  });
  const maxDaily = Math.max(1, ...last14.map(d => d.count));

  // Tone distribution
  const toneMap = {};
  items.forEach(i => { toneMap[i.tone] = (toneMap[i.tone] || 0) + 1; });
  const tones = Object.entries(toneMap).sort((a,b) => b[1]-a[1]);

  // Schedule stats
  const upcoming = wsScheduled.filter(s => new Date(s.date) >= now).length;
  const published = wsScheduled.filter(s => s.status === 'published').length;

  const accentColors = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', 'var(--warn)', 'var(--danger)'];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Content insights for {ws.name}</p>
      </div>

      {/* Top stats */}
      <div className="grid-4 mb-4">
        {[
          { label: 'Total Content', value: items.length, color: 'var(--accent)' },
          { label: 'Scheduled', value: upcoming, color: 'var(--accent3)' },
          { label: 'Published', value: published, color: 'var(--accent2)' },
          { label: 'Types Used', value: byType.filter(t => t.count > 0).length, color: 'var(--warn)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Daily activity */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Content Activity (14 days)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {last14.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: d.count > 0 ? 'var(--accent)' : 'var(--border)', height: `${Math.max(4, (d.count / maxDaily) * 100)}%`, transition: 'height 0.5s ease', opacity: d.count > 0 ? 1 : 0.3 }} title={`${d.label}: ${d.count} items`} />
                {i % 3 === 0 && <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', transform: 'rotate(-30deg)', marginTop: 2 }}>{d.label.split(' ')[1]}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>Last 14 days</div>
        </div>

        {/* Content type breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Content by Type</h3>
          {byType.every(t => t.count === 0) ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No content generated yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byType.filter(t => t.count > 0).sort((a,b) => b.count - a.count).map((t, i) => (
                <div key={t.id}>
                  <div className="flex justify-between" style={{ marginBottom: 4, fontSize: 13 }}>
                    <span>{t.icon} {t.label}</span>
                    <span style={{ color: 'var(--text3)' }}>{t.count} ({Math.round((t.count / items.length) * 100)}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(t.count / maxCount) * 100}%`, background: accentColors[i % accentColors.length], borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tone distribution */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Tone Distribution</h3>
          {tones.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No content yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tones.map(([tone, count], i) => (
                <div key={tone}>
                  <div className="flex justify-between" style={{ marginBottom: 4, fontSize: 13 }}>
                    <span style={{ textTransform: 'capitalize' }}>{tone}</span>
                    <span style={{ color: 'var(--text3)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(count / items.length) * 100}%`, background: accentColors[i % accentColors.length], borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule overview */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Schedule Overview</h3>
          {wsScheduled.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No scheduled posts</p>
          ) : (
            <>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                {[
                  { label: 'Scheduled', count: wsScheduled.filter(s=>s.status==='scheduled').length, color: 'var(--warn)' },
                  { label: 'Published', count: published, color: 'var(--accent3)' },
                  { label: 'Draft', count: wsScheduled.filter(s=>s.status==='draft').length, color: 'var(--text3)' },
                  { label: 'Upcoming', count: upcoming, color: 'var(--accent)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {wsScheduled.slice(0,4).map(s => (
                  <div key={s.id} className="flex gap-2 items-center" style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, minWidth: 55 }}>{new Date(s.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                    <span className="truncate">{s.topic}</span>
                    <span style={{ color: s.status==='published'?'var(--accent3)':'var(--warn)', flexShrink: 0, fontSize: 11 }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
