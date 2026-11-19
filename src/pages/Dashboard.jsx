import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { DataState, Table } from '../components/Controls';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day, money, statusLabel } from '../utils/format';

const colors = ['#274d77', '#6687ae', '#a36c2f', '#853643'];

function DashboardChart({ title, labels, values, type = 'bar' }) {
  const canvas = useRef(null);
  useEffect(() => {
    const chart = new Chart(canvas.current, {
      type, data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
      options: { responsive: true, plugins: { legend: { display: type === 'doughnut', position: 'bottom' } },
        ...(type === 'bar' && { scales: { y: { beginAtZero: true } } }) },
    });
    return () => chart.destroy();
  }, [labels, values, type]);
  return <section className="panel"><h2>{title}</h2><canvas ref={canvas} role="img" aria-label={`${title}. ${labels.map((label, index) => `${label} ${values[index]}`).join(', ')}`} /></section>;
}

export function Dashboard() {
  const { user } = useAuth();
  const result = useData('/reports/dashboard');
  return <><h1>Dashboard</h1><DataState result={result}>{data => {
    const admin = user.role === 'ADMIN';
    const metrics = [
      ...(user.role !== 'CUSTOMER' ? [['Total customers', data.customers]] : []),
      ['Total policies', data.policies], ['Active policies', data.byPolicy.ACTIVE], ['Expired policies', data.byPolicy.EXPIRED],
      ['Pending claims', data.byClaim.SUBMITTED + data.byClaim.UNDER_REVIEW], ['Approved claims', data.byClaim.APPROVED],
      ['Rejected claims', data.byClaim.REJECTED], ['Simulated premium collections', money(data.collections)],
    ];
    return <><p className="muted dashboard-label">{data.organization} · {user.name}</p>
      <div className="metrics">{metrics.map(([label, value]) => <section className="panel metric" key={label}><span>{label}</span><strong>{value}</strong></section>)}</div>
      <section className="panel"><h2>Alerts</h2>
        {user.role !== 'AGENT' && <p><Link to="/premiums">{data.payments.PENDING} pending and {data.payments.OVERDUE} overdue premium payments</Link></p>}
        <h3>Upcoming policy expiries</h3><Table headers={['Policy', 'Type', 'Expiry']} rows={data.expiring.map(policy => [
          policy.id, <Link to={`/policies/${policy.id}`}>{policy.number}</Link>, policy.type, day(policy.endDate),
        ])} />
      </section>
      {admin && <div className="chart-grid">
        <DashboardChart title="Policies by status" labels={Object.keys(data.byPolicy).map(statusLabel)} values={Object.values(data.byPolicy)} type="doughnut" />
        <DashboardChart title="Claims by status" labels={Object.keys(data.byClaim).map(statusLabel)} values={Object.values(data.byClaim)} type="doughnut" />
        <DashboardChart title="Monthly simulated premium collection (INR)" labels={data.monthly.map(item => item.month)} values={data.monthly.map(item => Number(item.premiums))} />
        <DashboardChart title="Monthly customer growth" labels={data.monthly.map(item => item.month)} values={data.monthly.map(item => item.customers)} />
      </div>}
    </>;
  }}</DataState></>;
}
