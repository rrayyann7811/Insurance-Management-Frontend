import { passwordHelp, passwordPattern } from '../utils/password';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/Auth';
import { errorMessage } from '../services/api';

export function AuthPage({ register = false }) {
  const { user, signIn } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
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
      <div className="auth-brand"><span className="brand-mark"><Icon name="shield" /></span><span>Insurance Management</span></div>
      <h1>{register ? 'Create a customer account' : 'Sign in'}</h1>
      <p className="muted auth-description">{register ? 'Create your portal account to manage policies, claims, and documents.' : 'Access your insurance workspace.'}</p>
      <form onSubmit={submit}>
        {register && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>}
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <div className="password-field"><label htmlFor="auth-password">Password</label><div><input id="auth-password" name="password" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={72} pattern={register ? passwordPattern : undefined} title={register ? passwordHelp : undefined} aria-describedby={register ? 'password-help' : undefined} />
          <button type="button" className="secondary" onClick={() => setVisible(value => !value)} aria-controls="auth-password">
            {visible ? 'Hide' : 'Show'}<span className="sr-only"> password</span>
          </button></div></div>
        {register && <p className="muted" id="password-help">{passwordHelp}</p>}
        {message && <p className="feedback error" role="alert">{message}</p>}
        <button disabled={busy}>{busy ? 'Please wait…' : register ? 'Register' : 'Sign in'}</button>
      </form>
      <Link to={register ? '/login' : '/register'}>{register ? 'Back to sign in' : 'Create a customer account'}</Link>
    </section>
  </main>;
}
