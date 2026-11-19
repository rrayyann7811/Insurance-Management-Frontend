import { useState } from 'react';
import { api, errorMessage } from '../services/api';

export function Download({ path, filename, children }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    setMessage('');
    try {
      const { data } = await api.get(path, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      const body = error.response?.data;
      let details;
      if (body instanceof Blob) {
        try { details = JSON.parse(await body.text()).message; } catch { /* Use the request error. */ }
      }
      setMessage(details || errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return <div className="action"><button type="button" className="secondary" disabled={busy} onClick={download}>{children}</button>
    {message && <small className="error" role="alert">{message}</small>}</div>;
}
