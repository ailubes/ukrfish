import React from 'react';
import { getAquacultureObjectsByRegion } from '@/lib/statsDataProcessor';
import BarChart from './BarChart';
import { WaterBasin } from '@/types/waterBasin';

interface AquacultureObjectsByRegionChartProps {
  data: WaterBasin[];
}

const AquacultureObjectsByRegionChart: React.FC<AquacultureObjectsByRegionChartProps> = ({ data }) => {
  const chartData = getAquacultureObjectsByRegion(data);
  return (
    <BarChart
      chartData={chartData}
      title="Кількість об'єктів аквакультури за областями"
    />
  );
};

export default AquacultureObjectsByRegionChart;
