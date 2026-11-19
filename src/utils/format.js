export const day = value => value ? value.slice(0, 10) : '—';
export const money = value => Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
export const statusLabel = value => value.toLowerCase().replaceAll('_', ' ');
