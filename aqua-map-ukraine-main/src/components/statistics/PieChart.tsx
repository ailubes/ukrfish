import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { PieChartData } from '@/lib/statsDataProcessor';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  chartData: PieChartData;
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ chartData, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false, // Title is handled by StatCard
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChart;
