import { Action, ApiForm, DataState, Table } from '../components/Controls';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';
import { Download } from '../components/Download';
import { useAuth } from '../context/Auth';
import { useData } from '../hooks/useData';
import { day } from '../utils/format';

export function Documents() {
  const { user } = useAuth();
  return <><h1>{user.role === 'CUSTOMER' ? 'My documents' : 'Documents'}</h1><DocumentPanel /></>;
}

export function DocumentPanel({ claim }) {
  const { user } = useAuth();
  const list = useData(claim ? `/documents?claimId=${claim.id}` : '/documents');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function view(file) {
    setPreviewBusy(true);
    setPreviewError('');
    try {
      const { data } = await api.get(`/documents/${file.id}/download`, { responseType: 'blob' });
      setPreview({ filename: file.filename, type: file.mimeType, url: URL.createObjectURL(data) });
    } catch (error) {
      setPreviewError(errorMessage(error));
    } finally {
      setPreviewBusy(false);
    }
  }

  const open = !claim || ['SUBMITTED', 'UNDER_REVIEW'].includes(claim.status);

  return <section className="panel"><h2>{claim ? 'Supporting documents' : 'Document library'}</h2>
    <DataState result={list}>{documents => <Table headers={['File', 'Customer', 'Uploaded', 'Verification', 'Actions']}
      rows={documents.map(document => [document.id, document.filename, document.customer.user.name, day(document.createdAt),
        document.verifiedAt ? `Verified ${day(document.verifiedAt)}` : 'Pending',
        <div className="actions">
          <button type="button" className="secondary" disabled={previewBusy} onClick={() => view(document)}>View</button>
          <Download path={`/documents/${document.id}/download`} filename={document.filename}>Download</Download>
          {user.role !== 'CUSTOMER' && !document.verifiedAt &&
            <Action path={`/documents/${document.id}/verify`} method="patch" onSuccess={list.reload}>Verify</Action>}
          {(user.role === 'ADMIN' || (user.role === 'CUSTOMER' && !document.verifiedAt && (!document.claimId || (claim ? claim.status : document.claim?.status) === 'SUBMITTED'))) &&
            <Action path={`/documents/${document.id}`} method="delete" onSuccess={list.reload}>Delete</Action>}
        </div>,
      ])} />}</DataState>
    {previewError && <p className="error" role="alert">{previewError}</p>}
    {preview && <section className="document-preview" aria-label="Document preview">
      <h3>{preview.filename}</h3>
      <button type="button" className="secondary" onClick={() => setPreview(null)}>Close preview</button>
      {preview.type === 'application/pdf' ? <iframe title={preview.filename} src={preview.url} /> :
        <img alt={preview.filename} src={preview.url} />}
    </section>}
    {user.role === 'CUSTOMER' && open && <ApiForm path="/documents" action="Upload document" multipart onSuccess={list.reload}>
      {claim && <input type="hidden" name="claimId" value={claim.id} />}
      <label>File<input name="file" type="file" accept="application/pdf,image/png,image/jpeg" required /></label>
      <p className="muted">PDF, PNG or JPEG, up to 5 MB.</p>
    </ApiForm>}
  </section>;
}
