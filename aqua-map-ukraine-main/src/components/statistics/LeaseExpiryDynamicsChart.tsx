import React from 'react';
import { getLeaseExpiryDynamics } from '@/lib/statsDataProcessor';
import LineChart from './LineChart';
import { WaterBasin } from '@/types/waterBasin';

interface LeaseExpiryDynamicsChartProps {
  data: WaterBasin[];
}

const LeaseExpiryDynamicsChart: React.FC<LeaseExpiryDynamicsChartProps> = ({ data }) => {
  const chartData = getLeaseExpiryDynamics(data);
  return (
    <LineChart
      chartData={chartData}
      title="Динаміка закінчення термінів дії договорів оренди"
    />
  );
};

export default LeaseExpiryDynamicsChart;
