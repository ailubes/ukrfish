import React from 'react';
import { getWaterBodiesByRegion } from '@/lib/statsDataProcessor';
import BarChart from './BarChart';
import { WaterBasin } from '@/types/waterBasin';

interface RegionDistributionChartProps {
  data: WaterBasin[];
}

const RegionDistributionChart: React.FC<RegionDistributionChartProps> = ({ data }) => {
  const chartData = getWaterBodiesByRegion(data);
  return (
    <BarChart
      chartData={chartData}
      title="Розподіл водних об'єктів за областями"
    />
  );
};

export default RegionDistributionChart;
