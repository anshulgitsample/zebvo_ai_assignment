import { useState } from 'react';
import { useAuthStore, useWorkspaceStore, useToastStore } from './store';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import GeneratorPage from './GeneratorPage';
import ContentPage from './ContentPage';
import SchedulePage from './SchedulePage';
import AnalyticsPage from './AnalyticsPage';
import WorkspacesPage from './WorkspacesPage';

// ── Toast renderer ────────────────────────────────────────
function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const colors = {
    success: 'var(--accent3)',
    error: 'var(--danger)',
    info: 'var(--accent)',
  };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            background: `${colors[t.type]}22`,
            color: colors[t.type],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {icons[t.type]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────
function Sidebar({ active, onNavigate }) {
  const { user, logout } = useAuthStore();
  const { workspaces, activeId, setActive, getActive } = useWorkspaceStore();
  const ws = getActive();

  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'generate', icon: '✦', label: 'Generate' },
    { id: 'content', icon: '◫', label: 'Content Library' },
    { id: 'schedule', icon: '◷', label: 'Schedule' },
    { id: 'analytics', icon: '◈', label: 'Analytics' },
    { id: 'workspaces', icon: '⊟', label: 'Workspaces' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">✦ BrandFlow</div>

      {/* Workspace switcher */}
      <div className="sidebar-section">
        <div className="sidebar-label">Workspace</div>
        {workspaces.map(w => (
          <div
            key={w.id}
            className={`workspace-item${w.id === activeId ? ' active' : ''}`}
            onClick={() => setActive(w.id)}
          >
            <div
              className="workspace-dot"
              style={{ background: w.color || 'var(--accent)' }}
            />
            <span
              className="truncate"
              style={{ fontSize: 13, flex: 1 }}
            >
              {w.name}
            </span>
            {w.id === activeId && (
              <span style={{ fontSize: 9, color: 'var(--accent3)' }}>●</span>
            )}
          </div>
        ))}
        <button
          className="nav-item"
          style={{ color: 'var(--text3)', fontSize: 13 }}
          onClick={() => onNavigate('workspaces')}
        >
          + New workspace
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-label">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${active === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/* User footer */}
      <div
        style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            padding: '8px 10px',
            background: 'var(--surface)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="truncate"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
            >
              {user?.name}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 11, color: 'var(--text3)' }}
            >
              {user?.email}
            </div>
          </div>
        </div>
        <button
          className="nav-item"
          style={{ color: 'var(--danger)', fontSize: 13, width: '100%' }}
          onClick={logout}
        >
          <span style={{ fontSize: 14 }}>⏻</span> Sign out
        </button>
      </div>
    </aside>
  );
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  const user = useAuthStore(s => s.user);
  const [page, setPage] = useState('dashboard');
  const [generatorInitialType, setGeneratorInitialType] = useState(null);

  if (!user) return (
    <>
      <AuthPage />
      <ToastContainer />
    </>
  );

  const handleNavigate = (target, extra) => {
    if (target === 'generate' && extra) {
      setGeneratorInitialType(extra);
    } else {
      setGeneratorInitialType(null);
    }
    setPage(target);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'generate':
        return (
          <GeneratorPage
            key={generatorInitialType}
            initialType={generatorInitialType || 'instagram'}
          />
        );
      case 'content':
        return <ContentPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'workspaces':
        return <WorkspacesPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar active={page} onNavigate={handleNavigate} />
      <main className="main-content">
        {renderPage()}
      </main>
      <ToastContainer />
    </div>
  );
}
