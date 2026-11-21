import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

export function PageHeading({ title, description, children }) {
  return <header className="page-heading">
    <div><h1>{title}</h1><p className="muted">{description}</p></div>
    {children && <div className="heading-actions">{children}</div>}
  </header>;
}

export function PageAction({ to, children, icon = 'plus', secondary = false }) {
  const { search } = useLocation();
  const destination = to.startsWith('#') ? { search, hash: to } : to;
  return <Link className={secondary ? 'button secondary' : 'button'} to={destination}><Icon name={icon} />{children}</Link>;
}
