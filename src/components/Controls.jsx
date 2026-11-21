import { useContext, useState } from 'react';
import { Icon } from './Icon';
import { SuccessFeedbackContext } from './SuccessFeedback';
import { api, errorMessage } from '../services/api';
import { statusLabel } from '../utils/format';

export function DataState({ result, children }) {
  if (result.message) return <div className="feedback error">
    <p role="alert">{result.message}</p><button type="button" className="secondary" onClick={result.reload}>Try again</button>
  </div>;
  if (!result.data) return <p className="feedback loading" role="status">Loading…</p>;
  return children(result.data);
}

export function EmptyState({ title, detail, icon = 'folder' }) {
  return <div className="empty-state">
    <span className="empty-icon"><Icon name={icon} /></span>
    <div><p>{title}</p>{detail && <small>{detail}</small>}</div>
  </div>;
}

export function Table({ headers, rows, emptyDetail }) {
  if (!rows.length) return <EmptyState title="No records found." detail={emptyDetail} />;
  return <div className="table-scroll" tabIndex={0} role="region" aria-label={`Records by ${headers[0].toLowerCase()}`}><table><thead><tr>{headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead>
    <tbody>{rows.map(([id, ...cells]) => <tr key={id}>{cells.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function Status({ value }) {
  return <span className={`status ${value.toLowerCase()}`}>{statusLabel(value)}</span>;
}

export function ApiForm({ path, method = 'post', action, children, onSuccess, multipart = false, confirm, columns = false }) {
  const [message, setMessage] = useState('');
  const showSuccess = useContext(SuccessFeedbackContext);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const prompt = confirm?.(values);
    if (prompt && !window.confirm(prompt)) return;
    setMessage('');
    setBusy(true);
    try {
      const response = await api[method](path, multipart ? values : Object.fromEntries(values));
      if (method === 'post') form.reset();
      onSuccess?.(response.data);
      showSuccess?.({ message: 'Changes saved.' });
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className={columns ? 'form-columns' : undefined}>
    {children}<button disabled={busy}>{busy ? 'Saving…' : action}</button>
    {message && <p className="feedback error" role="alert">{message}</p>}
  </form>;
}

export function Action({ path, children, onSuccess, method = 'post', confirmation }) {
  const [message, setMessage] = useState('');
  const showSuccess = useContext(SuccessFeedbackContext);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await api[method](path);
      onSuccess?.(response.data);
      showSuccess?.({ message: response.data?.message || 'Changes saved.' });
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return <div className="action"><button type="button" className="secondary" disabled={busy} onClick={run}>{busy ? 'Working…' : children}</button>
    {message && <small className="error" role="alert">{message}</small>}</div>;
}
