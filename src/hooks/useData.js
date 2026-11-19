import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

export function useData(path) {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!path) return;
    const request = new AbortController();
    setMessage('');
    setData(null);
    api.get(path, { signal: request.signal }).then(response => setData(response.data))
      .catch(error => { if (!request.signal.aborted) setMessage(errorMessage(error)); });
    return () => request.abort();
  }, [path, revision]);
  return { data, message, reload };
}
