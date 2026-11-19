import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/Auth';

export function Shell({ links }) {
  const { user, loading, logout } = useAuth();
  if (loading) return <main className="content">Loading session…</main>;
  if (!user) return <Navigate to="/login" replace />;
  return <div className="shell">
    <aside className="sidebar">
      <p className="brand">Insurance Management</p>
      <nav aria-label="Main navigation">
        {links.map(([path, label]) => <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>)}
      </nav>
      <div className="sidebar-account"><span>{user.name}</span><small>{user.role.toLowerCase()}</small>
        <button className="secondary" onClick={logout}>Sign out</button>
      </div>
    </aside>
    <main className="content"><Outlet /></main>
  </div>;
}
