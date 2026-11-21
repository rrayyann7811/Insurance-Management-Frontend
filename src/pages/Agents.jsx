import { PageAction, PageHeading } from '../components/PageHeading';
import { passwordHelp, passwordPattern } from '../utils/password';
import { ApiForm, DataState, Status, Table } from '../components/Controls';
import { useData } from '../hooks/useData';

export function Agents() {
  const list = useData('/agents');
  return <><PageHeading title="Agents" description="Create agent accounts and manage their access to the workspace.">
      <PageAction to="#create-agent">Add agent</PageAction>
    </PageHeading>
    <section className="panel"><h2>Agent accounts</h2><DataState result={list}>{agents => <Table
      headers={['Email', 'Account', 'Manage']} rows={agents.map(agent => [agent.id, agent.email, <Status value={agent.active ? 'ACTIVE' : 'DISABLED'} />,
        <ApiForm path={`/agents/${agent.id}`} method="patch" action="Save changes" onSuccess={list.reload}>
          <label>Name<input name="name" defaultValue={agent.name} required minLength={2} maxLength={100} /></label>
          <label>Status<select name="active" defaultValue={String(agent.active)}><option value="true">Active</option><option value="false">Disabled</option></select></label>
        </ApiForm>,
      ])} />}</DataState></section>
    <section className="panel" id="create-agent" tabIndex={-1}><h2>Create agent</h2><ApiForm path="/agents" action="Create agent" columns onSuccess={list.reload}>
      <label>Name<input name="name" required minLength={2} maxLength={100} /></label>
      <label>Email<input name="email" type="email" required /></label>
      <label>Initial password<input name="password" type="password" minLength={12} maxLength={72} pattern={passwordPattern} title={passwordHelp} autoComplete="new-password" required /></label>
      <p className="muted">{passwordHelp}</p>
    </ApiForm></section>
  </>;
}
