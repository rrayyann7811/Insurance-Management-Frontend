import { createContext, useContext, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem('insurance-token')));
  const [sessionError, setSessionError] = useState('');
  function clearSession() {
    sessionStorage.removeItem('insurance-token');
    setUser(null);
    setSessionError('');
  }

  useEffect(() => {
    window.addEventListener('insurance-session-expired', clearSession);
    return () => window.removeEventListener('insurance-session-expired', clearSession);
  }, []);

  async function restoreSession() {
    if (!sessionStorage.getItem('insurance-token')) return;
    setLoading(true);
    setSessionError('');
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error) {
      if (error.response?.status === 401) clearSession();
      else setSessionError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { restoreSession(); }, []);

  async function logout() {
    try {
      await api.post('/auth/logout');
      clearSession();
    } catch (error) {
      if (error.response?.status === 401) clearSession();
      else setSessionError(errorMessage(error));
    }
  }

  async function signIn(action, values) {
    const { data } = await api.post(`/auth/${action}`, values);
    sessionStorage.setItem('insurance-token', data.token);
    setSessionError('');
    setUser(data.user);
  }
  return <AuthContext.Provider value={{ user, setUser, loading, signIn, logout, sessionError, restoreSession }}>{children}</AuthContext.Provider>;
}
