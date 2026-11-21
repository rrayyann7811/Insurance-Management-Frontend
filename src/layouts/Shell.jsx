import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SuccessFeedback } from '../components/SuccessFeedback';
import { useAuth } from '../context/Auth';

const icons = {
  '/': 'dashboard', '/customers': 'people', '/policies': 'policy', '/claims': 'claim',
  '/premiums': 'wallet', '/documents': 'folder', '/reports': 'report', '/agents': 'people',
  '/settings': 'settings', '/profile': 'user',
};
const groups = [
  ['Overview', ['/']],
  ['Insurance', ['/customers', '/policies', '/claims', '/premiums', '/documents']],
  ['Administration', ['/reports', '/agents', '/settings']],
  ['Account', ['/profile']],
];
const roles = { ADMIN: 'Administrator', AGENT: 'Insurance agent', CUSTOMER: 'Customer' };

function Sidebar({ links, user, logout, sessionError, onNavigate, children, compact = false }) {
  return <>
    <div className="sidebar-heading">
      <span className="brand-mark"><Icon name="shield" /></span>
      <span className="sidebar-label brand">Insurance<span>Management</span></span>
      {children}
    </div>
    <nav aria-label="Main navigation">
      {groups.map(([group, paths]) => {
        const entries = links.filter(([path]) => paths.includes(path));
        if (!entries.length) return null;
        return <div className="nav-group" key={group}>
          <p className="sidebar-label nav-caption">{group}</p>
          {entries.map(([path, label]) => <NavLink key={path} to={path} onClick={onNavigate} end={path === '/'}
            aria-label={label} title={compact ? label : undefined}><Icon name={icons[path]} /><span className="sidebar-label">{label}</span></NavLink>)}
        </div>;
      })}
    </nav>
    <div className="sidebar-account">
      <div className="account-row">
        <span className="avatar" aria-hidden="true">{user.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('')}</span>
        <div className="sidebar-label"><strong>{user.name}</strong><small>{roles[user.role]}</small></div>
      </div>
      <button className="sign-out" onClick={logout} aria-label="Sign out" title={compact ? 'Sign out' : undefined}>
        <Icon name="logout" /><span className="sidebar-label">Sign out</span>
      </button>
      {sessionError && <small role="alert">{sessionError}</small>}
    </div>
  </>;
}

export function Shell({ links }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useRef(null);
  const { key, hash } = useLocation();
  const { user, loading, logout, sessionError, restoreSession } = useAuth();

  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ block: 'start' });
      target.focus({ preventScroll: true });
    }
  }, [key, hash, user]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    function closeOnDesktop(event) {
      if (event.matches) drawer.current?.close();
    }
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  if (loading) return <main className="content"><p className="feedback" role="status">Loading session…</p></main>;
  if (!user && sessionError) return <main className="content">
    <p className="feedback error" role="alert">{sessionError}</p><button onClick={restoreSession}>Retry session</button>
  </main>;
  if (!user) return <Navigate to="/login" replace />;
  const sidebar = { links, user, logout, sessionError };

  return <div className={collapsed ? 'shell shell-collapsed' : 'shell'}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar"><Sidebar {...sidebar} compact={collapsed} /></aside>
    <dialog id="workspace-menu" className="mobile-drawer" ref={drawer} aria-label="Workspace navigation"
      onClose={() => setMenuOpen(false)}
      onClick={event => { if (event.target === event.currentTarget) drawer.current.close(); }}>
      <div className="drawer-body"><Sidebar {...sidebar} onNavigate={() => drawer.current.close()}>
        <button type="button" className="icon-button close-menu" aria-label="Close menu" onClick={() => drawer.current.close()}><Icon name="close" /></button>
      </Sidebar></div>
    </dialog>
    <div className="workspace">
      <header className="topbar">
        <button type="button" className="icon-button menu-toggle" aria-label="Menu" aria-controls="workspace-menu" aria-expanded={menuOpen}
          onClick={() => { drawer.current.showModal(); setMenuOpen(true); }}><Icon name="menu" /></button>
        <button type="button" className="icon-button desktop-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}><Icon name="collapse" /></button>
        <span className="workspace-name">Insurance workspace</span>
        <span className="topbar-user"><Icon name="user" /><span>{user.name}</span></span>
      </header>
      <main className="content" id="main-content" tabIndex={-1}><SuccessFeedback><Outlet /></SuccessFeedback></main>
    </div>
  </div>;
}
