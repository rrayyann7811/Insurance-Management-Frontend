import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { DataState, EmptyState, Status } from '../components/Controls';
import { Icon } from '../components/Icon';
import { PageAction, PageHeading } from '../components/PageHeading';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day, money, statusLabel } from '../utils/format';

const DashboardChart = lazy(() => import('../components/DashboardChart'));
const statusColors = {
  ACTIVE: '#16836E', EXPIRED: '#7c8da1', CANCELLED: '#C35F5B',
  SUBMITTED: '#2864A5', UNDER_REVIEW: '#DB9A36', APPROVED: '#16836E', REJECTED: '#C35F5B',
};
const monthLabel = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });

function Metrics({ items }) {
  return <div className="metrics">{items.map(([label, value, icon, to, note]) => {
    const content = <>
      <span className="metric-top"><span className={`metric-icon metric-${icon}`}><Icon name={icon} /></span>{to && <Icon name="arrow" />}</span>
      <span className="metric-label">{label}</span><strong>{value}</strong>
      {note && <small>{note}</small>}
    </>;
    return to ? <Link key={label} className="panel metric" to={to}>{content}</Link> :
      <div key={label} className="panel metric">{content}</div>;
  })}</div>;
}

function Queue({ title, to, linkLabel, children }) {
  return <section className="panel queue">
    <div className="panel-heading"><h2>{title}</h2><Link to={to}>{linkLabel} <Icon name="arrow" /></Link></div>
    {children}
  </section>;
}

function Expiries({ records }) {
  return <Queue title="Upcoming policy expiries" to="/policies?status=ACTIVE" linkLabel="Active policies">
    {records.length ? <ul className="record-list">{records.slice(0, 5).map(policy => (
      <li key={policy.id}><div><Link to={`/policies/${policy.id}`}>{policy.number}</Link><small>{policy.type}</small></div>
        <span className="date-label">{day(policy.endDate)}</span></li>
    ))}</ul> : <EmptyState icon="calendar" title="No expiries in the alert window" detail="Policies nearing their expiry date will appear here." />}
  </Queue>;
}

function ClaimQueue({ customer, counts }) {
  const submitted = useData(!customer && counts.SUBMITTED ? '/claims?status=SUBMITTED' : null);
  const reviewing = useData(!customer && counts.UNDER_REVIEW ? '/claims?status=UNDER_REVIEW' : null);
  const latest = useData(customer && Object.values(counts).some(Boolean) ? '/claims' : null);
  const results = customer ? (Object.values(counts).some(Boolean) ? [latest] : []) : [
    ...(counts.SUBMITTED ? [submitted] : []),
    ...(counts.UNDER_REVIEW ? [reviewing] : []),
  ];
  const records = results.flatMap(result => result.data?.items ?? [])
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt)).slice(0, customer ? 1 : 5);
  return <Queue title={customer ? 'Latest claim status' : 'Claims awaiting review'} to="/claims" linkLabel={customer ? 'View my claims' : 'View claim queue'}>
    {results.map((result, index) => !result.data && <DataState key={index} result={result} />)}
    {records.length > 0 && <ul className="record-list">{records.map(claim => (
      <li key={claim.id}><div><Link to={`/claims/${claim.id}`}>{claim.policy.type} claim</Link>
        <small>{claim.policy.number} · {day(claim.createdAt)}</small></div><Status value={claim.status} /></li>
    ))}</ul>}
    {results.every(result => result.data) && !records.length && <EmptyState icon="claim"
      title={customer ? 'No claims submitted' : 'No claims awaiting review'}
      detail={customer ? 'Check your policies before submitting a claim.' : 'Submitted and in-review claims will appear here.'} />}
  </Queue>;
}

function PremiumQueue({ payments }) {
  return <Queue title="Premiums to follow up" to="/premiums" linkLabel="View payments">
    {payments.PENDING || payments.OVERDUE ? <ul className="record-list">
      <li><Link to="/premiums?status=PENDING">Pending premium payments</Link><Status value="PENDING" /><strong>{payments.PENDING}</strong></li>
      <li><Link to="/premiums?status=OVERDUE">Overdue premium payments</Link><Status value="OVERDUE" /><strong>{payments.OVERDUE}</strong></li>
    </ul> : <EmptyState icon="wallet" title="No outstanding premiums" detail="Pending or overdue simulated payments will appear here." />}
  </Queue>;
}

function RecentPolicies({ hasPolicies }) {
  const result = useData(hasPolicies ? '/policies' : null);
  const empty = <EmptyState icon="policy" title="No policies recorded" detail="New policies will appear here once they’re created." />;
  return <Queue title="Recently created policies" to="/policies" linkLabel="View policies">
    {hasPolicies ? <DataState result={result}>{data => data.items.length ?
      <ul className="record-list">{data.items.slice(0, 4).map(policy => (
        <li key={policy.id}><div><Link to={`/policies/${policy.id}`}>{policy.number}</Link>
          <small>{policy.type} · {day(policy.createdAt)}</small></div><Status value={policy.status} /></li>
      ))}</ul> : empty
    }</DataState> : empty}
  </Queue>;
}

function CustomerDocuments() {
  const documents = useData('/documents');
  return <Queue title="My documents" to="/documents" linkLabel="Open library">
    <DataState result={documents}>{files => files.length ?
      <ul className="record-list">{files.slice(0, 3).map(file => (
        <li key={file.id}><div><strong>{file.filename}</strong><small>Uploaded {day(file.createdAt)}</small></div>
          <Status value={file.verifiedAt ? 'VERIFIED' : 'PENDING'} /></li>
      ))}</ul> : <EmptyState icon="folder" title="No documents uploaded" detail="Open your library to upload a PDF or image." />
    }</DataState>
  </Queue>;
}

function AnalyticsCard({ title, detail, values, ...chart }) {
  return <section className="panel chart-card">
    <h3>{title}</h3>
    {values.some(Boolean) ? <Suspense fallback={<p className="chart-canvas muted" role="status">Loading chart…</p>}>
      <DashboardChart title={title} values={values} {...chart} />
    </Suspense> : <EmptyState icon="report" title="No activity to chart" detail={detail} />}
  </section>;
}

function Distribution({ title, counts, detail }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  return <AnalyticsCard title={title} detail={detail} values={entries.map(([, count]) => count)}
    labels={entries.map(([status]) => statusLabel(status))} colors={entries.map(([status]) => statusColors[status])} />;
}

function Analytics({ data }) {
  if (!data.policies && !Object.values(data.byClaim).some(Boolean) && !data.monthly.some(month => month.customers || Number(month.premiums))) {
    return <section className="panel"><h2>Portfolio analytics</h2><EmptyState icon="report" title="Analytics will appear as records are added"
      detail="Policy and claim activity, customer registrations, and simulated payments will populate the charts." /></section>;
  }
  const labels = data.monthly.map(item => monthLabel.format(new Date(`${item.month}-01T00:00:00Z`)));
  return <section aria-labelledby="analytics-heading">
    <div className="section-heading"><h2 id="analytics-heading">Portfolio analytics</h2><p className="muted">Monthly charts cover the last six calendar months.</p></div>
    <div className="chart-grid">
      <AnalyticsCard title="Monthly premium collections" detail="Simulated premium payments will appear here."
        labels={labels} values={data.monthly.map(item => Number(item.premiums))} currency />
      <AnalyticsCard title="Customer growth" detail="New registrations will appear here."
        labels={labels} values={data.monthly.map(item => item.customers)} />
      <Distribution title="Policies by status" counts={data.byPolicy} detail="Policy activity will appear after a policy is created." />
      <Distribution title="Claims by status" counts={data.byClaim} detail="Claim activity will appear after a claim is submitted." />
    </div>
  </section>;
}

function AdminOverview({ data, pending }) {
  return <>
    <Metrics items={[
      ['Active policies', data.byPolicy.ACTIVE, 'policy', '/policies?status=ACTIVE'],
      ['Total customers', data.customers, 'people', '/customers'],
      ['Pending claims', pending, 'claim', '/claims', 'Submitted or under review'],
      ['Simulated premium collections', money(data.collections), 'wallet', '/premiums?status=PAID'],
    ]} />
    <dl className="panel summary-strip">
      <div><dt>Total policies</dt><dd>{data.policies}</dd></div>
      <div><dt>Expired policies</dt><dd><Link to="/policies?status=EXPIRED">{data.byPolicy.EXPIRED}</Link></dd></div>
      <div><dt>Approved claims</dt><dd><Link to="/claims?status=APPROVED">{data.byClaim.APPROVED}</Link></dd></div>
      <div><dt>Rejected claims</dt><dd><Link to="/claims?status=REJECTED">{data.byClaim.REJECTED}</Link></dd></div>
    </dl>
    <div className="dashboard-grid">
      <ClaimQueue counts={data.byClaim} /><Expiries records={data.expiring} />
      <PremiumQueue payments={data.payments} /><RecentPolicies hasPolicies={data.policies > 0} />
    </div>
    <Analytics data={data} />
  </>;
}

function RoleOverview({ data, customer, pending }) {
  const claims = Object.values(data.byClaim).reduce((sum, count) => sum + count, 0);
  return <>
    <Metrics items={customer ? [
      ['My active policies', data.byPolicy.ACTIVE, 'policy', '/policies?status=ACTIVE', `${data.policies} total policies`],
      ['My upcoming premiums', data.payments.PENDING, 'wallet', '/premiums?status=PENDING', `${data.payments.OVERDUE} overdue`],
      ['My claims', claims, 'claim', '/claims', `${pending} submitted or under review`],
    ] : [
      ['Assigned customers', data.customers, 'people', '/customers'],
      ['Policies managed', data.policies, 'policy', '/policies', `${data.byPolicy.ACTIVE} active`],
      ['Claims awaiting review', pending, 'claim', '/claims'],
    ]} />
    <div className="dashboard-grid">
      <ClaimQueue customer={customer} counts={data.byClaim} /><Expiries records={data.expiring} />
      {customer && <CustomerDocuments />}
    </div>
  </>;
}

export function Dashboard() {
  const { user } = useAuth();
  const result = useData('/reports/dashboard');
  const admin = user.role === 'ADMIN';
  const customer = user.role === 'CUSTOMER';
  return <div className="dashboard">
    <PageHeading title="Dashboard" description={`Welcome, ${user.name}. ${admin ? 'Here’s your portfolio and the work that needs attention.' :
      customer ? 'See your coverage, claims, and upcoming payments.' : 'Review your assigned portfolio and open claims.'}`}>
      {admin ? <><PageAction to="/reports" icon="report" secondary>View reports</PageAction>
        <PageAction to="/customers#register-customer">Add customer</PageAction></> :
        customer ? <><PageAction to="/policies" icon="policy" secondary>View policies</PageAction>
          <PageAction to="/claims#submit-claim">Start a claim</PageAction></> :
          <><PageAction to="/claims" icon="claim" secondary>View assigned claims</PageAction>
            <PageAction to="/policies#create-policy">New policy</PageAction></>}
    </PageHeading>
    <DataState result={result}>{data => {
      const pending = data.byClaim.SUBMITTED + data.byClaim.UNDER_REVIEW;
      return admin ? <AdminOverview data={data} pending={pending} /> : <RoleOverview data={data} customer={customer} pending={pending} />;
    }}</DataState>
  </div>;
}
