import { useState } from 'react';
import { api, errorMessage } from '../services/api';
import { statusLabel } from '../utils/format';

export function DataState({ result, children }) {
  if (result.message) return <p className="error" role="alert">{result.message}</p>;
  if (!result.data) return <p className="muted" role="status">Loading…</p>;
  return children(result.data);
}

export function Table({ headers, rows }) {
  if (!rows.length) return <p className="muted">No records found.</p>;
  return <div className="table-scroll"><table><thead><tr>{headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead>
    <tbody>{rows.map(([id, ...cells]) => <tr key={id}>{cells.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function Status({ value }) {
  return <span className={`status ${value.toLowerCase()}`}>{statusLabel(value)}</span>;
}

export function ApiForm({ path, method = 'post', action, children, onSuccess, multipart = false }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setMessage('');
    setBusy(true);
    try {
      const response = await api[method](path, multipart ? values : Object.fromEntries(values));
      if (method === 'post') form.reset();
      onSuccess?.(response.data);
      setMessage('Saved.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit}>
    {children}<button disabled={busy}>{busy ? 'Saving…' : action}</button>
    {message && <p className={message === 'Saved.' ? 'muted' : 'error'} role="status">{message}</p>}
  </form>;
}

export function Action({ path, children, onSuccess, method = 'post' }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    setMessage('');
    try {
      const response = await api[method](path);
      onSuccess?.(response.data);
      setMessage(response.data?.message || 'Saved.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return <div className="action"><button type="button" className="secondary" disabled={busy} onClick={run}>{children}</button>
    {message && <small role="status">{message}</small>}</div>;
}
