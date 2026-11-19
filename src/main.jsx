import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/Auth';
import { Shell } from './layouts/Shell';
import { AuthPage } from './pages/AuthPage';
import './styles.css';

function Home() {
  const { user } = useAuth();
  return <><h1>Dashboard</h1><p>Signed in as {user.name}.</p></>;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><Routes>
  <Route path="/login" element={<AuthPage key="login" />} />
  <Route path="/register" element={<AuthPage key="register" register />} />
  <Route element={<Shell links={[[ '/', 'Dashboard' ]]} />}>
    <Route index element={<Home />} />
  </Route>
</Routes></AuthProvider></BrowserRouter>);
