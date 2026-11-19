import { useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { statusLabel } from '../utils/format';

export function useList(path) {
  const [params, setParams] = useSearchParams();
  return { ...useData(`${path}?${params}`), params, setParams };
}

export function ListFilters({ list, statuses = [] }) {
  const key = `${list.params.get('q') || ''}:${list.params.get('status') || ''}`;
  return <form className="filters" key={key} onSubmit={event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    list.setParams(Object.fromEntries([...values].filter(([, value]) => String(value).trim())));
  }}>
    <label>Search<input type="search" name="q" maxLength={100} defaultValue={list.params.get('q') || ''} /></label>
    {!!statuses.length && <label>Status<select name="status" defaultValue={list.params.get('status') || ''}>
      <option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
    </select></label>}
    <button>Apply</button>
    {list.params.size > 0 && <button type="button" className="secondary" onClick={() => list.setParams({})}>Clear</button>}
  </form>;
}

export function Pagination({ list, data }) {
  const { page, total, pageSize } = data;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  function go(target) {
    const next = new URLSearchParams(list.params);
    next.set('page', target);
    list.setParams(next);
  }
  return <nav className="pagination" aria-label="Pagination">
    <button className="secondary" disabled={page <= 1} onClick={() => go(Math.min(page - 1, pages))}>Previous</button>
    <span>Page {page} of {pages} · {total} records</span>
    <button className="secondary" disabled={page >= pages} onClick={() => go(page + 1)}>Next</button>
  </nav>;
}
