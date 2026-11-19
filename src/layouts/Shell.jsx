import { useState } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/Auth';

export function Shell({ links }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout, sessionError, restoreSession } = useAuth();
  if (loading) return <main className="content">Loading session…</main>;
  if (!user && sessionError) return <main className="content">
    <p role="alert">{sessionError}</p><button onClick={restoreSession}>Retry session</button>
  </main>;
  if (!user) return <Navigate to="/login" replace />;
  return <div className="shell">
    <aside className={menuOpen ? "sidebar menu-open" : "sidebar"}>
      <div className="sidebar-heading">
        <p className="brand">Insurance Management</p>
        <button type="button" className="secondary menu-toggle" aria-controls="workspace-menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}>{menuOpen ? 'Close menu' : 'Menu'}</button>
      </div>
      <div className="sidebar-menu" id="workspace-menu">
      <nav aria-label="Main navigation">
        {links.map(([path, label]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} end={path === '/'}>{label}</NavLink>)}
      </nav>
      <div className="sidebar-account"><span>{user.name}</span><small>{user.role.toLowerCase()}</small>
        <button className="secondary" onClick={logout}>Sign out</button>
        {sessionError && <small role="alert">{sessionError}</small>}
      </div>
      </div>
    </aside>
    <main className="content"><Outlet /></main>
  </div>;
}
