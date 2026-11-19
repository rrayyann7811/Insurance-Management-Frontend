import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/Auth';
import { Shell } from './layouts/Shell';
import { AuthPage } from './pages/AuthPage';
import { CustomerDetail, Customers } from './pages/Customers';
import { Policies, PolicyDetail } from './pages/Policies';
import { Claims, ClaimDetail } from './pages/Claims';
import { Premiums } from './pages/Premiums';
import { Agents } from './pages/Agents';
import { AgentProfile } from './pages/AgentProfile';
import { Documents } from './pages/Documents';
import { Reports, Settings } from './pages/Reports';
import './styles.css';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to="/" replace />;
}

function Profile() {
  const { user } = useAuth();
  return user.role === 'AGENT' ? <AgentProfile /> : <CustomerDetail profile />;
}

function Navigation() {
  const { user } = useAuth();
  const links = [['/', 'Dashboard']];
  if (user && user.role !== 'CUSTOMER') links.push(['/customers', 'Customers']);
  links.push(['/policies', user?.role === 'CUSTOMER' ? 'My Policies' : 'Policies']);
  links.push(['/claims', user?.role === 'CUSTOMER' ? 'My Claims' : user?.role === 'AGENT' ? 'Assigned Claims' : 'Claims']);
  if (user?.role !== 'AGENT') links.push(['/premiums', user?.role === 'CUSTOMER' ? 'Premium Payments' : 'Premiums']);
  links.push(['/documents', user?.role === 'CUSTOMER' ? 'My Documents' : 'Documents']);
  if (user?.role === 'ADMIN') links.push(['/reports', 'Reports'], ['/agents', 'Agents'], ['/settings', 'Settings']);
  if (user && user.role !== 'ADMIN') links.push(['/profile', 'Profile']);
  return <Shell links={links} />;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><Routes>
  <Route path="/login" element={<AuthPage key="login" />} />
  <Route path="/register" element={<AuthPage key="register" register />} />
  <Route element={<Navigation />}>
    <Route index element={<Suspense fallback={<p role="status">Loading dashboard…</p>}><Dashboard /></Suspense>} />
    <Route path="customers" element={<RoleRoute roles={['ADMIN', 'AGENT']}><Customers /></RoleRoute>} />
    <Route path="customers/:id" element={<RoleRoute roles={['ADMIN', 'AGENT']}><CustomerDetail /></RoleRoute>} />
    <Route path="policies" element={<Policies />} />
    <Route path="policies/:id" element={<PolicyDetail />} />
    <Route path="claims" element={<Claims />} />
    <Route path="claims/:id" element={<ClaimDetail />} />
    <Route path="premiums" element={<RoleRoute roles={['ADMIN', 'CUSTOMER']}><Premiums /></RoleRoute>} />
    <Route path="agents" element={<RoleRoute roles={['ADMIN']}><Agents /></RoleRoute>} />
    <Route path="documents" element={<Documents />} />
    <Route path="reports" element={<RoleRoute roles={['ADMIN']}><Reports /></RoleRoute>} />
    <Route path="settings" element={<RoleRoute roles={['ADMIN']}><Settings /></RoleRoute>} />
    <Route path="profile" element={<RoleRoute roles={['CUSTOMER', 'AGENT']}><Profile /></RoleRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
</Routes></AuthProvider></BrowserRouter>);
