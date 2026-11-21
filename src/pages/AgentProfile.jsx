import { PageHeading } from '../components/PageHeading';
import { ApiForm } from '../components/Controls';
import { useAuth } from '../context/Auth';

export function AgentProfile() {
  const { user, setUser } = useAuth();
  return <><PageHeading title="Profile" description="View your insurance agent account details." /><section className="panel">
    <p>{user.email}</p>
    <ApiForm path="/auth/me" method="patch" action="Save profile" onSuccess={setUser}>
      <label>Name<input name="name" required minLength={2} maxLength={100} defaultValue={user.name} /></label>
    </ApiForm>
  </section></>;
}
