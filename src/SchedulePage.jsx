import { useEffect, useState } from 'react';
import { useScheduleStore, useToastStore, useWorkspaceStore } from './store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = first - 1; i >= 0; i--) days.push({ day: daysInPrev - i, current: false });
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true });
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) days.push({ day: i, current: false });
  return days;
}

export default function SchedulePage() {
  const { scheduled, loadSchedule, remove, update } = useScheduleStore();
  const ws = useWorkspaceStore(s => s.getActive());
  const loadWorkspaces = useWorkspaceStore(s => s.loadWorkspaces);
  const toast = useToastStore(s => s.show);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('calendar');

  useEffect(() => {
    loadWorkspaces().catch(() => toast('Failed to load workspaces', 'error'));
  }, [loadWorkspaces, toast]);

  useEffect(() => {
    if (!ws?.id) return;
    loadSchedule(ws.id).catch(() => toast('Failed to load schedule', 'error'));
  }, [ws?.id, loadSchedule, toast]);

  const wsScheduled = scheduled.filter(s => s.workspaceId === ws?.id);
  const calDays = getCalendarDays(year, month);

  const getPostsForDay = (day) => {
    if (!day.current) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day.day).padStart(2,'0')}`;
    return wsScheduled.filter(s => s.date === dateStr);
  };

  const selectedPosts = selectedDay ? getPostsForDay(selectedDay) : [];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const upcoming = wsScheduled.filter(s => new Date(s.date) >= today).sort((a,b) => new Date(a.date) - new Date(b.date));
  const past = wsScheduled.filter(s => new Date(s.date) < today).sort((a,b) => new Date(b.date) - new Date(a.date));

  const platformColors = { instagram: '#e1306c', linkedin: '#0a66c2', twitter: '#1da1f2', campaign: '#4f7cff', hashtags: '#7c5cfc', carousel: '#00e5b0', marketing: '#ffb347', reel: '#ff4d6a' };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Content Schedule</h1>
          <p className="page-subtitle">{wsScheduled.length} posts scheduled for {ws?.name}</p>
        </div>
        <div className="tabs">
          <button className={`tab${view === 'calendar' ? ' active' : ''}`} onClick={() => setView('calendar')}>📅 Calendar</button>
          <button className={`tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>📋 List</button>
        </div>
      </div>

      {view === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          <div className="card">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button className="btn btn-ghost btn-sm" onClick={prevMonth}>← Prev</button>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{MONTHS[month]} {year}</h3>
              <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Next →</button>
            </div>

            {/* Day headers */}
            <div className="cal-grid" style={{ marginBottom: 8 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text3)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="cal-grid">
              {calDays.map((day, i) => {
                const posts = getPostsForDay(day);
                const isToday = day.current && day.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = selectedDay?.day === day.day && selectedDay?.current === day.current;
                return (
                  <div key={i}
                    className={`cal-cell${isToday ? ' today' : ''}${posts.length > 0 ? ' has-post' : ''}${!day.current ? ' other-month' : ''}`}
                    style={{ background: isSelected ? 'rgba(79,124,255,0.12)' : undefined, borderColor: isSelected ? 'var(--accent)' : undefined }}
                    onClick={() => day.current && setSelectedDay(day)}>
                    <span>{day.day}</span>
                    {posts.length > 1 && (
                      <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, lineHeight: 1 }}>{posts.length}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text2)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent3)' }} />
                Has scheduled post
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text2)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--accent)' }} />
                Today
              </div>
            </div>
          </div>

          {/* Day detail */}
          <div className="card">
            {selectedDay ? (
              <>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>
                  {MONTHS[month]} {selectedDay.day}, {year}
                </h4>
                {selectedPosts.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: 13 }}>No posts scheduled for this day</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedPosts.map(p => (
                      <div key={p.id} style={{ padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, borderLeft: `3px solid ${platformColors[p.platform] || 'var(--accent)'}` }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }} className="truncate">{p.topic}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.platform} · {p.time}</div>
                        <div className="flex gap-2 mt-2">
                          <select className="select" style={{ fontSize: 11, padding: '3px 6px' }} value={p.status}
                            onChange={async e => {
                              try {
                                await update(p.id, { status: e.target.value });
                                toast('Status updated', 'success');
                              } catch (err) {
                                toast(err.message || 'Update failed', 'error');
                              }
                            }}>
                            <option value="scheduled">Scheduled</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                          <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={async () => {
                            try {
                              await remove(p.id);
                              setSelectedDay(null);
                              toast('Removed', 'info');
                            } catch (err) {
                              toast(err.message || 'Remove failed', 'error');
                            }
                          }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                Click a day to see scheduled posts
              </div>
            )}

            {wsScheduled.length > 0 && (
              <>
                <div className="divider" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Upcoming</div>
                  {upcoming.slice(0,4).map(p => (
                    <div key={p.id} className="flex gap-2 items-center" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <div style={{ color: 'var(--accent)', fontWeight: 600, minWidth: 45 }}>{new Date(p.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                      <div className="truncate" style={{ flex: 1 }}>{p.topic}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcoming.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--accent3)' }}>Upcoming ({upcoming.length})</h3>
              {upcoming.map(p => (
                <div key={p.id} className="card" style={{ borderLeft: `3px solid ${platformColors[p.platform] || 'var(--accent)'}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div style={{ background: 'rgba(79,124,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: 'var(--accent)', minWidth: 70, textAlign: 'center' }}>
                        {new Date(p.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.topic}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.platform} · {p.time} · <span style={{ color: p.status === 'published' ? 'var(--accent3)' : 'var(--warn)' }}>{p.status}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select className="select" style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }} value={p.status}
                        onChange={async e => {
                          try {
                            await update(p.id, { status: e.target.value });
                            toast('Updated', 'success');
                          } catch (err) {
                            toast(err.message || 'Update failed', 'error');
                          }
                        }}>
                        <option value="scheduled">Scheduled</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        try {
                          await remove(p.id);
                          toast('Removed', 'info');
                        } catch (err) {
                          toast(err.message || 'Remove failed', 'error');
                        }
                      }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text3)', marginTop: 8 }}>Past ({past.length})</h3>
              {past.map(p => (
                <div key={p.id} className="card" style={{ opacity: 0.6, borderLeft: `3px solid var(--border)` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div style={{ fontSize: 12, color: 'var(--text3)', minWidth: 70 }}>{new Date(p.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{p.topic}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.platform}</div>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                      try {
                        await remove(p.id);
                        toast('Removed', 'info');
                      } catch (err) {
                        toast(err.message || 'Remove failed', 'error');
                      }
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {wsScheduled.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>📅</div>
              <h3>No scheduled posts</h3>
              <p>Save content and schedule it from the Content Library.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
