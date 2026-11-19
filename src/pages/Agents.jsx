import { ApiForm, DataState, Table } from '../components/Controls';
import { useData } from '../hooks/useData';

export function Agents() {
  const list = useData('/agents');
  return <><h1>Agents</h1>
    <section className="panel"><h2>Agent accounts</h2><DataState result={list}>{agents => <Table
      headers={['Email', 'Account', 'Manage']} rows={agents.map(agent => [agent.id, agent.email, agent.active ? 'Active' : 'Disabled',
        <ApiForm path={`/agents/${agent.id}`} method="patch" action="Save changes" onSuccess={list.reload}>
          <label>Name<input name="name" defaultValue={agent.name} required minLength={2} maxLength={100} /></label>
          <label>Status<select name="active" defaultValue={String(agent.active)}><option value="true">Active</option><option value="false">Disabled</option></select></label>
        </ApiForm>,
      ])} />}</DataState></section>
    <section className="panel"><h2>Create agent</h2><ApiForm path="/agents" action="Create agent" onSuccess={list.reload}>
      <label>Name<input name="name" required minLength={2} maxLength={100} /></label>
      <label>Email<input name="email" type="email" required /></label>
      <label>Initial password<input name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" required /></label>
      <p className="muted">Use at least 12 characters with uppercase, lowercase and a digit.</p>
    </ApiForm></section>
  </>;
}
