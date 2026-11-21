import { PageAction, PageHeading } from '../components/PageHeading';
import { ListFilters, Pagination, useList } from '../components/ListFilters';
import { DocumentPanel } from './Documents';
import { Link, useParams } from 'react-router-dom';
import { ApiForm, DataState, Status, Table } from '../components/Controls';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day, money } from '../utils/format';

export function Claims() {
  const { user } = useAuth();
  const list = useList('/claims');
  const policies = useData(user.role === 'CUSTOMER' ? '/policies/options' : null);
  return <><PageHeading title={user.role === 'CUSTOMER' ? 'My claims' : user.role === 'AGENT' ? 'Assigned claims' : 'Claims'}
      description={user.role === 'CUSTOMER' ? 'Submit a claim and track its review.' : 'Find claims by policy or status and follow their progress.'}>
      {user.role === 'CUSTOMER' && <PageAction to="#submit-claim">Start a claim</PageAction>}
    </PageHeading>
    <section className="panel"><ListFilters list={list} statuses={['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']} /><DataState result={list}>{data => <><Table emptyDetail={list.params.has('q') || list.params.has('status') ? 'Try a different search or clear the filters.' : 'New records will appear here when available.'} headers={['Policy', 'Amount', 'Incident', 'Status', 'Agent', 'Details']}
      rows={data.items.map(claim => [claim.id, claim.policy.number, money(claim.amount), day(claim.incidentDate),
        <Status value={claim.status} />, claim.agent?.name || 'Unassigned', <Link to={`/claims/${claim.id}`}>View claim</Link>,
      ])} /><Pagination list={list} data={data} /></>}</DataState></section>
    {user.role === 'CUSTOMER' && <section className="panel" id="submit-claim" tabIndex={-1}><h2>Submit a claim</h2>
      <DataState result={policies}>{records => {
        const eligible = records;
        return eligible.length ? <ApiForm path="/claims" action="Submit claim" columns onSuccess={list.reload}>
          <label>Policy<select name="policyId" required>{eligible.map(policy => <option key={policy.id} value={policy.id}>{policy.type} · {policy.number}</option>)}</select></label>
          <label>Amount (INR)<input name="amount" type="number" min=".01" step=".01" required /></label>
          <label>Incident date<input name="incidentDate" type="date" max={day(new Date().toISOString())} required /></label>
          <label>Description<textarea name="description" minLength={10} maxLength={2000} required /></label>
        </ApiForm> : <p>No eligible policies. <Link to="/policies">View your policy terms</Link>.</p>;
      }}</DataState>
    </section>}
  </>;
}

export function ClaimDetail() {
  const { id } = useParams();
  const path = `/claims/${id}`;
  const { user } = useAuth();
  const result = useData(path);
  const agents = useData(user.role === 'ADMIN' ? '/agents' : null);
  return <><PageHeading title="Claim details" description="Review the incident, status, and supporting documents." /><DataState result={result}>{claim => {
    const open = ['SUBMITTED', 'UNDER_REVIEW'].includes(claim.status);
    return <><section className="panel">
      <h2>{claim.policy.type} claim</h2><Status value={claim.status} />
      <p>Policy {claim.policy.number}</p><p>Amount {money(claim.amount)} · Incident {day(claim.incidentDate)}</p>
      <p>{claim.description}</p><p>Assignee {claim.agent?.name || 'Unassigned'}</p>
      {claim.reviewedAt && <><p>Reviewed by {claim.reviewer?.name} on {day(claim.reviewedAt)}</p><p>{claim.reviewNotes}</p></>}
    </section>
    {open && user.role === 'ADMIN' && <section className="panel"><h2>Assign claim</h2>
      <DataState result={agents}>{records => {
        const active = records.filter(agent => agent.active);
        return active.length ? <ApiForm path={`${path}/assign`} method="patch" action="Assign agent" onSuccess={result.reload}>
          <label>Agent<select name="agentId" defaultValue={claim.agentId || ''} required>
            <option value="" disabled>Choose an agent</option>
            {active.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
          </select></label>
        </ApiForm> : <p>Create an active agent account to assign this claim.</p>;
      }}</DataState>
    </section>}
    {open && user.role !== 'CUSTOMER' && <section className="panel"><h2>Review claim</h2>
      <ApiForm path={`${path}/review`} method="patch" action="Save review" confirm={values => ['APPROVED', 'REJECTED'].includes(values.get('status'))
        ? 'Save this final claim decision?' : ''} onSuccess={result.reload}>
        <label>Next status<select name="status">{claim.status === 'SUBMITTED' ? <option value="UNDER_REVIEW">Under review</option> :
          <><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></>}</select></label>
        <label>Review notes<textarea name="notes" required minLength={3} maxLength={2000} /></label>
      </ApiForm>
    </section>}
    <DocumentPanel claim={claim} />
    </>;
  }}</DataState></>;
}
