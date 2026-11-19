import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ url }) {
  const canvas = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [rendered, setRendered] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const task = getDocument({ url, isEvalSupported: false, enableXfa: false, maxImageSize: 10000000 });
    let current = true;
    task.promise.then(document => { if (current) setPdf(document); })
      .catch(() => { if (current) setError('This PDF could not be opened. Try downloading it.'); });
    return () => {
      current = false;
      void task.destroy().catch(() => {});
    };
  }, [url]);

  useEffect(() => {
    if (!pdf) return;
    let active = true;
    let task;
    async function render() {
      try {
        const documentPage = await pdf.getPage(page);
        if (!active) return;
        const original = documentPage.getViewport({ scale: 1 });
        const scale = Math.min(1.5, 900 / original.width, 1300 / original.height);
        const viewport = documentPage.getViewport({ scale });
        canvas.current.width = Math.ceil(viewport.width);
        canvas.current.height = Math.ceil(viewport.height);
        task = documentPage.render({ canvas: canvas.current, viewport });
        await task.promise;
        if (active) setRendered(page);
      } catch {
        if (active) setError('This PDF page could not be displayed. Try downloading it.');
      }
    }
    void render();
    return () => {
      active = false;
      task?.cancel();
    };
  }, [pdf, page]);

  if (error) return <p className="error" role="alert">{error}</p>;
  return <>
    {rendered !== page && <p role="status">Rendering PDF page…</p>}
    <canvas ref={canvas} role="img" aria-label={`PDF page ${page}`} hidden={rendered !== page} />
    {pdf?.numPages > 1 && <div className="pagination" aria-label="PDF pages">
      <button type="button" className="secondary" disabled={page <= 1 || rendered !== page} onClick={() => setPage(page - 1)}>Previous page</button>
      <span>Page {page} of {pdf.numPages}</span>
      <button type="button" className="secondary" disabled={page >= pdf.numPages || rendered !== page} onClick={() => setPage(page + 1)}>Next page</button>
    </div>}
  </>;
}
