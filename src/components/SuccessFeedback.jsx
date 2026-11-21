import { createContext, useEffect, useState } from 'react';

export const SuccessFeedbackContext = createContext(null);

export function SuccessFeedback({ children }) {
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return <SuccessFeedbackContext.Provider value={setNotice}>
    {children}
    <div className="success-announcement" role="status">
      {notice && <p className="feedback success">{notice.message}</p>}
    </div>
  </SuccessFeedbackContext.Provider>;
}
