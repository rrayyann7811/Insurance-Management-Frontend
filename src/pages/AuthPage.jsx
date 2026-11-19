import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/Auth';
import { errorMessage } from '../services/api';

export function AuthPage({ register = false }) {
  const { user, signIn } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await signIn(register ? 'register' : 'login', values);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <section className="panel auth-panel">
      <p className="brand">Insurance Management Platform</p>
      <h1>{register ? 'Create a customer account' : 'Sign in'}</h1>
      <form onSubmit={submit}>
        {register && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>}
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={72} /></label>
        {register && <p className="muted">Use 12 or more characters with uppercase, lowercase and a digit.</p>}
        {message && <p className="error" role="alert">{message}</p>}
        <button disabled={busy}>{busy ? 'Please wait…' : register ? 'Register' : 'Sign in'}</button>
      </form>
      <Link to={register ? '/login' : '/register'}>{register ? 'Back to sign in' : 'Create a customer account'}</Link>
    </section>
  </main>;
}
