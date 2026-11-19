import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem('insurance-token')));
  function logout() {
    sessionStorage.removeItem('insurance-token');
    setUser(null);
  }

  useEffect(() => {
    if (!sessionStorage.getItem('insurance-token')) return;
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(logout).finally(() => setLoading(false));
  }, []);

  async function signIn(action, values) {
    const { data } = await api.post(`/auth/${action}`, values);
    sessionStorage.setItem('insurance-token', data.token);
    setUser(data.user);
  }
  return <AuthContext.Provider value={{ user, setUser, loading, signIn, logout }}>{children}</AuthContext.Provider>;
}
