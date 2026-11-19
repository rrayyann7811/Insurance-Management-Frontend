import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/Auth';
import { Shell } from './layouts/Shell';
import { AuthPage } from './pages/AuthPage';
import { CustomerDetail, Customers } from './pages/Customers';
import { Policies, PolicyDetail } from './pages/Policies';
import './styles.css';

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to="/" replace />;
}

function Navigation() {
  const { user } = useAuth();
  const links = [['/', 'Dashboard']];
  if (user && user.role !== 'CUSTOMER') links.push(['/customers', 'Customers']);
  links.push(['/policies', user?.role === 'CUSTOMER' ? 'My Policies' : 'Policies']);
  if (user?.role === 'CUSTOMER') links.push(['/profile', 'Profile']);
  return <Shell links={links} />;
}

function Home() {
  const { user } = useAuth();
  return <><h1>Dashboard</h1><p>Signed in as {user.name}.</p></>;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><Routes>
  <Route path="/login" element={<AuthPage key="login" />} />
  <Route path="/register" element={<AuthPage key="register" register />} />
  <Route element={<Navigation />}>
    <Route index element={<Home />} />
    <Route path="customers" element={<RoleRoute roles={['ADMIN', 'AGENT']}><Customers /></RoleRoute>} />
    <Route path="customers/:id" element={<RoleRoute roles={['ADMIN', 'AGENT']}><CustomerDetail /></RoleRoute>} />
    <Route path="policies" element={<Policies />} />
    <Route path="policies/:id" element={<PolicyDetail />} />
    <Route path="profile" element={<RoleRoute roles={['CUSTOMER']}><CustomerDetail profile /></RoleRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
</Routes></AuthProvider></BrowserRouter>);
