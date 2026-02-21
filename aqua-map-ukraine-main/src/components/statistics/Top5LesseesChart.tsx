import React from 'react';
import { getTop5Lessees } from '@/lib/statsDataProcessor';
import BarChart from './BarChart';
import { WaterBasin } from '@/types/waterBasin';

interface Top5LesseesChartProps {
  data: WaterBasin[];
}

const Top5LesseesChart: React.FC<Top5LesseesChartProps> = ({ data }) => {
  const chartData = getTop5Lessees(data);
  return (
    <BarChart
      chartData={chartData}
      title="ТОП-5 Орендарів за кількістю водних об'єктів"
      horizontal={true}
    />
  );
};

export default Top5LesseesChart;
