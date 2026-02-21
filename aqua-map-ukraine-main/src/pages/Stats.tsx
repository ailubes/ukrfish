'use client';

import React from 'react';
import { WaterBasin } from '@/types/waterBasin';
import StatCard from '@/components/statistics/StatCard';
import RegionDistributionChart from '@/components/statistics/RegionDistributionChart';
import AquacultureObjectsByRegionChart from '@/components/statistics/AquacultureObjectsByRegionChart';
import Top5LesseesChart from '@/components/statistics/Top5LesseesChart';
import LeaseExpiryDynamicsChart from '@/components/statistics/LeaseExpiryDynamicsChart';
import LeaseAgreementStatusChart from '@/components/statistics/LeaseAgreementStatusChart';
import DistributionByPurposeChart from '@/components/statistics/DistributionByPurposeChart';
import ObjectsByTypeChart from '@/components/statistics/ObjectsByTypeChart';
import waterData from '@/data/vodni_obiekty_1748944527.json'; // Direct import of JSON data
import Layout from '@/components/layout/Layout';

export default function StatsPage() {
  const data: WaterBasin[] = waterData as WaterBasin[]; // Cast to WaterBasin[]

  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-8">Статистика</h1>
        <p>Дані відсутні.</p>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Статистика</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <StatCard title="Розподіл водних об'єктів за областями">
            <RegionDistributionChart data={data} />
          </StatCard>
          <StatCard title="Кількість об'єктів аквакультури за областями">
            <AquacultureObjectsByRegionChart data={data} />
          </StatCard>
          <StatCard title="ТОП-5 Орендарів за кількістю водних об'єктів">
            <Top5LesseesChart data={data} />
          </StatCard>
          <StatCard title="Динаміка закінчення термінів дії договорів оренди">
            <LeaseExpiryDynamicsChart data={data} />
          </StatCard>
          <StatCard title="Статус договорів оренди">
            <LeaseAgreementStatusChart data={data} />
          </StatCard>
          <StatCard title="Розподіл за цільовим використанням">
            <DistributionByPurposeChart data={data} />
          </StatCard>
          <StatCard title="Кількість об'єктів за типом">
            <ObjectsByTypeChart data={data} />
          </StatCard>
        </div>
      </div>
    </Layout>
  );
}
