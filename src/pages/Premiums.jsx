import { Action, DataState, Status, Table } from '../components/Controls';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day, money } from '../utils/format';

export function Premiums() {
  const { user } = useAuth();
  const list = useData('/premiums');
  return <><h1>Premium payments</h1><section className="panel">
    <p className="muted">Simulated payments only. No money or payment details are collected.</p>
    <DataState result={list}>{payments => <>
      <p className="notice">{payments.filter(item => item.status === 'PENDING').length} pending · {payments.filter(item => item.status === 'OVERDUE').length} overdue</p>
      <Table headers={['Policy', 'Customer', 'Amount', 'Due date', 'Status', 'Paid on', 'Action']}
        rows={payments.map(payment => [payment.id, payment.policy.number, payment.policy.customer.user.name, money(payment.amount),
          day(payment.dueDate), <Status value={payment.status} />, day(payment.paidAt),
          user.role === 'CUSTOMER' && payment.status !== 'PAID' && payment.policy.status !== 'CANCELLED' ?
            <Action path={`/premiums/${payment.id}/confirm`} onSuccess={list.reload}>Confirm simulated payment</Action> : '—',
        ])} />
    </>}</DataState>
  </section></>;
}
