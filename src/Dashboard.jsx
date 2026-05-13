import { useContentStore, useScheduleStore, useWorkspaceStore } from './store';

import { CONTENT_TYPES } from './aiService';

export default function Dashboard({ onNavigate }) {
  const { getActive, workspaces } = useWorkspaceStore();
  const { getByWorkspace } = useContentStore();
  const { scheduled } = useScheduleStore();

  const ws = getActive();
  const items = ws ? getByWorkspace(ws.id) : [];

  const byType = CONTENT_TYPES.map(t => ({
    ...t,
    count: items.filter(i => i.contentType === t.id).length,
  })).filter(t => t.count > 0);

  const recent = items.slice(0, 5);
  const upcomingScheduled = scheduled.filter(s => new Date(s.date) >= new Date()).slice(0, 4);

  const totalScheduled = scheduled.filter(s => s.workspaceId === ws?.id).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Welcome back ✦</h1>
        <p className="page-subtitle">Here's what's happening with {ws?.name || 'your workspace'}</p>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-4">
        <div className="stat-card">
          <div className="stat-value text-accent">{items.length}</div>
          <div className="stat-label">Total Content</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent3)' }}>{totalScheduled}</div>
          <div className="stat-label">Scheduled Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{workspaces.length}</div>
          <div className="stat-label">Workspaces</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warn)' }}>{byType.length}</div>
          <div className="stat-label">Content Types Used</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Recent Content */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>Recent Content</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('content')}>View all</button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 14 }}>
              No content yet. Generate your first post!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 20, flexShrink: 0 }}>
                    {CONTENT_TYPES.find(t => t.id === item.contentType)?.icon || '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{item.topic}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.contentType} · {new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary w-full mt-4" style={{ justifyContent: 'center' }} onClick={() => onNavigate('generate')}>
            + Generate New Content
          </button>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Content breakdown */}
          <div className="card">
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Content Breakdown</h3>
            {byType.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Generate content to see analytics</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byType.map(t => (
                  <div key={t.id}>
                    <div className="flex justify-between text-sm" style={{ marginBottom: 4 }}>
                      <span>{t.icon} {t.label}</span>
                      <span className="text-muted">{t.count}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (t.count / Math.max(1, items.length)) * 100)}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming scheduled */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>Upcoming Posts</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('schedule')}>Calendar</button>
            </div>
            {upcomingScheduled.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>No scheduled posts. Plan your content!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingScheduled.map(s => (
                  <div key={s.id} className="flex gap-3 items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ background: 'rgba(79,124,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="truncate" style={{ fontSize: 13 }}>{s.topic}</div>
                    <span className={`badge badge-${s.platform === 'instagram' ? 'purple' : s.platform === 'linkedin' ? 'blue' : 'gray'}`} style={{ flexShrink: 0, fontSize: 11 }}>{s.platform}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card mt-4" style={{ marginTop: 20 }}>
        <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Quick Generate</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CONTENT_TYPES.map(t => (
            <button key={t.id} className="btn btn-ghost btn-sm" onClick={() => onNavigate('generate', t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
