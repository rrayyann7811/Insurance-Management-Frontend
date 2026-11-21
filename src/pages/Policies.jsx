import { PageAction, PageHeading } from '../components/PageHeading';
import { ListFilters, Pagination, useList } from '../components/ListFilters';
import { Link, useParams } from 'react-router-dom';
import { Action, ApiForm, DataState, Status, Table } from '../components/Controls';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day, money } from '../utils/format';

function PolicyFields({ policy }) {
  return <>
    <label>Policy type<input name="type" required minLength={2} maxLength={80} defaultValue={policy?.type} /></label>
    <label>Description<textarea name="description" maxLength={1000} defaultValue={policy?.description ?? ''} /></label>
  </>;
}

export function Policies() {
  const { user } = useAuth();
  const list = useList('/policies');
  const customers = useData(user.role !== 'CUSTOMER' ? '/customers/options' : null);

  return <><PageHeading title={user.role === 'CUSTOMER' ? 'My policies' : 'Policies'}
      description={user.role === 'CUSTOMER' ? 'Review your coverage, policy status, and expiry dates.' : 'Manage coverage, policy terms, and upcoming renewals.'}>
      {user.role !== 'CUSTOMER' && <PageAction to="#create-policy">New policy</PageAction>}
    </PageHeading>
    <section className="panel"><ListFilters list={list} statuses={['ACTIVE', 'EXPIRED', 'CANCELLED']} /><DataState result={list}>{data => <><Table emptyDetail={list.params.has('q') || list.params.has('status') ? 'Try a different search or clear the filters.' : 'New records will appear here when available.'}
      headers={['Policy', 'Customer', 'Type', 'Status', 'Expiry', 'Premium']} rows={data.items.map(policy => [
        policy.id, <Link to={`/policies/${policy.id}`}>{policy.number}</Link>, policy.customer.user.name,
        policy.type, <Status value={policy.status} />, <>{day(policy.endDate)}{policy.expiringSoon && <small className="notice">Expiring soon</small>}</>, money(policy.premium),
      ])} /><Pagination list={list} data={data} /></>}</DataState></section>
    {user.role !== 'CUSTOMER' && <section className="panel" id="create-policy" tabIndex={-1}><h2>Create policy</h2>
      <DataState result={customers}>{records => records.length ? <ApiForm path="/policies" action="Create policy" columns onSuccess={list.reload}>
        <label>Customer<select name="customerId" required>{records.map(customer => <option key={customer.id} value={customer.id}>{customer.user.name}</option>)}</select></label>
        <PolicyFields />
        <label>Coverage (INR)<input name="coverage" type="number" min=".01" step=".01" required /></label>
        <label>Premium (INR)<input name="premium" type="number" min=".01" step=".01" required /></label>
        <label>Start date<input name="startDate" type="date" required /></label>
        <label>Expiry date<input name="endDate" type="date" required /></label>
      </ApiForm> : <p>A policy needs a customer account. <Link to="/customers">Open customers</Link> to check available accounts.</p>}</DataState>
    </section>}
  </>;
}

export function PolicyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const path = `/policies/${id}`;
  const result = useData(path);
  const cutoff = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return <><PageHeading title="Policy details" description="Review the coverage, term, and renewal history for this policy." /><DataState result={result}>{policy => <>
    <section className="panel">
      <h2>{policy.number}</h2><Status value={policy.status} />
      <p>{policy.customer.user.name} · {policy.type}</p>
      <p>{policy.description}</p>
      <p>Term {day(policy.startDate)} to {day(policy.endDate)}</p>
      <p>Coverage {money(policy.coverage)} · Premium {money(policy.premium)}</p>
      <div className="actions">
        {user.role !== 'AGENT' && policy.status !== 'CANCELLED' && day(policy.endDate) <= cutoff &&
          <Action path={`${path}/renew`} confirmation="Renew this policy for 365 days?" onSuccess={result.reload}>Renew for 365 days</Action>}
        {user.role === 'ADMIN' && policy.status === 'ACTIVE' &&
          <Action path={`${path}/cancel`} confirmation="Cancel this policy? This ends the current coverage." onSuccess={result.reload}>Cancel policy</Action>}
      </div>
    </section>
    {user.role !== 'CUSTOMER' && policy.status === 'ACTIVE' && <section className="panel"><h2>Edit policy</h2>
      <ApiForm path={path} method="patch" action="Save policy" onSuccess={result.reload}><PolicyFields policy={policy} /></ApiForm>
    </section>}
    <section className="panel"><h2>Renewals</h2><Table headers={['Renewed on', 'Previous expiry', 'New expiry']} rows={policy.renewals.map(renewal => [
      renewal.id, day(renewal.renewedAt), day(renewal.oldEndDate), day(renewal.newEndDate),
    ])} /></section>
  </>}</DataState></>;
}
