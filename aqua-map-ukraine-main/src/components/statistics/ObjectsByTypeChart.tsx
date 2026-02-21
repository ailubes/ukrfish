import React from 'react';
import { getObjectsByType } from '@/lib/statsDataProcessor';
import BarChart from './BarChart';
import { WaterBasin } from '@/types/waterBasin';

interface ObjectsByTypeChartProps {
  data: WaterBasin[];
}

const ObjectsByTypeChart: React.FC<ObjectsByTypeChartProps> = ({ data }) => {
  const chartData = getObjectsByType(data);
  return (
    <BarChart
      chartData={chartData}
      title="Кількість об'єктів за типом"
    />
  );
};

export default ObjectsByTypeChart;
