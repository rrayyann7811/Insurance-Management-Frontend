import { useEffect, useRef } from 'react';
import { BarController, BarElement, ArcElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, Tooltip } from 'chart.js';
import { money } from '../utils/format';

const currencyTick = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1,
});

Chart.register(BarController, BarElement, ArcElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip);

export default function DashboardChart({ title, labels, values, colors, currency }) {
  const canvas = useRef(null);
  const distribution = Boolean(colors);
  const type = distribution ? 'doughnut' : 'bar';
  const format = currency ? money : String;

  useEffect(() => {
    const chart = new Chart(canvas.current, {
      type,
      data: { labels, datasets: [{
        data: values,
        backgroundColor: colors || '#2864A5',
        ...(distribution ? { borderWidth: 2, borderColor: '#fff', cutout: '70%' } : { borderRadius: 4, maxBarThickness: 32 }),
      }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        color: '#4e6178',
        plugins: {
          legend: { display: distribution, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12 } },
          tooltip: { callbacks: { label: item => format(item.raw) } },
        },
        ...(distribution ? {} : { scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0 } },
          y: { beginAtZero: true, grid: { color: '#e0e7ef' }, ticks: currency ? { callback: value => currencyTick.format(value) } : { precision: 0 } },
        } }),
      },
    });
    return () => chart.destroy();
  }, [labels, values, type, colors, format, distribution]);

  return <div className="chart-canvas">
    <canvas ref={canvas} role="img" aria-label={`${title}. ${labels.map((label, index) => `${label} ${format(values[index])}`).join(', ')}`} />
  </div>;
}
