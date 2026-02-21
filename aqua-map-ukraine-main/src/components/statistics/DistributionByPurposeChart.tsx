import React from 'react';
import { getDistributionByPurpose } from '@/lib/statsDataProcessor';
import PieChart from './PieChart';
import { WaterBasin } from '@/types/waterBasin';

interface DistributionByPurposeChartProps {
  data: WaterBasin[];
}

const DistributionByPurposeChart: React.FC<DistributionByPurposeChartProps> = ({ data }) => {
  const chartData = getDistributionByPurpose(data);
  return (
    <PieChart
      chartData={chartData}
      title="Розподіл за цільовим використанням"
    />
  );
};

export default DistributionByPurposeChart;
