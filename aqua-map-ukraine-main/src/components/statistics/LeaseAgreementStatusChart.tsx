import React from 'react';
import { getLeaseAgreementStatus } from '@/lib/statsDataProcessor';
import PieChart from './PieChart';
import { WaterBasin } from '@/types/waterBasin';

interface LeaseAgreementStatusChartProps {
  data: WaterBasin[];
}

const LeaseAgreementStatusChart: React.FC<LeaseAgreementStatusChartProps> = ({ data }) => {
  const chartData = getLeaseAgreementStatus(data);
  return (
    <PieChart
      chartData={chartData}
      title="Статус договорів оренди"
    />
  );
};

export default LeaseAgreementStatusChart;
