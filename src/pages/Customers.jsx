import { Link, useParams } from 'react-router-dom';
import { ApiForm, DataState, Status, Table } from '../components/Controls';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day } from '../utils/format';

function CustomerFields({ customer }) {
  return <>
    <label>Name<input name="name" required minLength={2} maxLength={100} defaultValue={customer?.user.name} /></label>
    {!customer && <>
      <label>Email<input name="email" type="email" required /></label>
      <label>Initial password<input name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" /></label>
      <p className="muted">Use at least 12 characters with uppercase, lowercase and a digit.</p>
    </>}
    <label>Phone<input name="phone" type="tel" maxLength={40} defaultValue={customer?.phone ?? ''} /></label>
    <label>Address<textarea name="address" maxLength={300} defaultValue={customer?.address ?? ''} /></label>
  </>;
}

export function Customers() {
  const list = useData('/customers');
  return <><h1>Customers</h1>
    <section className="panel"><DataState result={list}>{customers => <Table headers={['Name', 'Email', 'Agent', 'Registered']}
      rows={customers.map(customer => [customer.id, <Link to={`/customers/${customer.id}`}>{customer.user.name}</Link>,
        customer.user.email, customer.agent?.name || 'Unassigned', day(customer.createdAt)])} />}</DataState></section>
    <section className="panel"><h2>Register customer</h2>
      <ApiForm path="/customers" action="Register customer" onSuccess={list.reload}><CustomerFields /></ApiForm>
    </section>
  </>;
}

export function CustomerDetail({ profile = false }) {
  const { id } = useParams();
  const { setUser } = useAuth();
  const path = `/customers/${profile ? 'me' : id}`;
  const result = useData(path);
  return <><h1>{profile ? 'My profile' : 'Customer profile'}</h1><DataState result={result}>{customer => <>
    <section className="panel">
      <h2>{customer.user.name}</h2><p className="muted">{customer.user.email}</p>
      <ApiForm path={path} method="patch" action="Save profile" onSuccess={updated => {
        if (profile) setUser(updated.user);
        result.reload();
      }}><CustomerFields customer={customer} /></ApiForm>
    </section>
    <section className="panel"><h2>Policy history</h2>
      <Table headers={['Policy', 'Type', 'Status', 'Expiry']} rows={customer.policies.map(policy => [
        policy.id, <Link to={`/policies/${policy.id}`}>{policy.number}</Link>, policy.type, <Status value={policy.status} />, day(policy.endDate),
      ])} />
    </section>
  </>}</DataState></>;
}
