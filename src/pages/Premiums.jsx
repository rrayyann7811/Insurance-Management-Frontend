import { ListFilters, Pagination, useList } from '../components/ListFilters';
import { Action, DataState, Status, Table } from '../components/Controls';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day, money } from '../utils/format';

export function Premiums() {
  const { user } = useAuth();
  const list = useList('/premiums');
  return <><h1>Premium payments</h1><section className="panel">
    <p className="muted">Simulated payments only. No money or payment details are collected.</p>
    <ListFilters list={list} statuses={['PENDING', 'PAID', 'OVERDUE']} />
    <DataState result={list}>{data => <>
      <Table headers={['Policy', 'Customer', 'Amount', 'Due date', 'Status', 'Paid on', 'Action']}
        rows={data.items.map(payment => [payment.id, payment.policy.number, payment.policy.customer.user.name, money(payment.amount),
          day(payment.dueDate), payment.policy.status === 'CANCELLED' && payment.status !== 'PAID'
            ? <span className="status cancelled">Closed · policy cancelled</span> : <Status value={payment.status} />, day(payment.paidAt),
          user.role === 'CUSTOMER' && payment.status !== 'PAID' && payment.policy.status !== 'CANCELLED' ?
            <Action path={`/premiums/${payment.id}/confirm`} onSuccess={list.reload}>Confirm simulated payment</Action> : '—',
        ])} />
      <Pagination list={list} data={data} />
    </>}</DataState>
  </section></>;
}
