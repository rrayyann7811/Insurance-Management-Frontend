import { ApiForm } from '../components/Controls';
import { useAuth } from '../context/Auth';

export function AgentProfile() {
  const { user, setUser } = useAuth();
  return <><h1>Profile</h1><section className="panel">
    <p>{user.email}</p>
    <ApiForm path="/auth/me" method="patch" action="Save profile" onSuccess={setUser}>
      <label>Name<input name="name" required minLength={2} maxLength={100} defaultValue={user.name} /></label>
    </ApiForm>
  </section></>;
}
