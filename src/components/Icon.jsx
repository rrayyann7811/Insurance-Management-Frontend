const paths = {
  shield: 'M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10ZM9 12l2 2 4-4',
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm4-4a4 4 0 0 1 0 8',
  policy: 'M6 3h9l4 4v14H6zm8 0v5h5M9 12h7m-7 4h7',
  claim: 'M9 5H5v16h14V5h-4m-6-2h6v4H9zm-1 9h8m-8 4h5',
  wallet: 'M20 8V5H5a2 2 0 0 0-2 2v12h17v-4m-17-8a2 2 0 0 0 2 2h16v6h-6V9m3 3h.01',
  folder: 'M3 6h7l2 3h9v11H3z',
  report: 'M4 4v16h17M8 16v-4m5 4V8m5 8V5',
  settings: 'M4 7h16M4 17h16M9 4v6m6 4v6',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  logout: 'M10 4H4v16h6m-1-8h12m-4-4 4 4-4 4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  collapse: 'M3 4h18v16H3zm6 0v16m8-11-3 3 3 3',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  calendar: 'M4 6h16v15H4zm0 5h16M8 3v5m8-5v5',
};

export function Icon({ name }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
