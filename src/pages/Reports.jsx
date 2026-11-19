import { useState } from 'react';
import { ApiForm, DataState } from '../components/Controls';
import { Download } from '../components/Download';
import { useData } from '../hooks/useData';
import { money } from '../utils/format';

export function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const path = `/reports/monthly?month=${month}`;
  const result = useData(month ? path : null);
  return <><h1>Monthly business report</h1><section className="panel">
    <label>Report month<input type="month" value={month} onChange={event => setMonth(event.target.value)} required /></label>
    {month && <DataState result={result}>{report => <>
      <dl className="report-summary">
        <dt>New customers</dt><dd>{report.customers}</dd>
        <dt>Policies issued</dt><dd>{report.policies}</dd>
        <dt>Policy renewals</dt><dd>{report.renewals}</dd>
        <dt>Claims submitted</dt><dd>{report.claims}</dd>
        <dt>Simulated payments</dt><dd>{report.payments}</dd>
        <dt>Simulated premium collection</dt><dd>{money(report.collections)}</dd>
      </dl>
      <Download path={`/reports/monthly.pdf?month=${month}`} filename={`insurance-report-${month}.pdf`}>Download PDF report</Download>
    </>}</DataState>}
  </section></>;
}

export function Settings() {
  const result = useData('/settings');
  return <><h1>Settings</h1><section className="panel"><DataState result={result}>{settings =>
    <ApiForm path="/settings" method="patch" action="Save settings" onSuccess={result.reload}>
      <label>Organization name<input name="organization" defaultValue={settings.organization} minLength={2} maxLength={100} required /></label>
      <label>Dashboard expiry alert window in days<input name="expiryAlertDays" type="number" min="1" max="90" defaultValue={settings.expiryAlertDays} required /></label>
    </ApiForm>
  }</DataState></section></>;
}
