import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

export function useData(path) {
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!path) return;
    const request = new AbortController();
    api.get(path, { signal: request.signal })
      .then(response => setResult({ path, revision, data: response.data }))
      .catch(error => {
        if (!request.signal.aborted) setResult({ path, revision, message: errorMessage(error) });
      });
    return () => request.abort();
  }, [path, revision]);

  if (!path || result?.path !== path || result.revision !== revision) return { data: null, reload };
  return { ...result, reload };
}
