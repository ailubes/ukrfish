'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';
import { Eye } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import { useVisitorCount } from '@/hooks/useVisitorCount';

const CounterPage: React.FC = () => {
  const totalViews = useVisitorCount();

  return (
    <Layout>
      <div className="container mx-auto px-8 py-16 text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Лічильник відвідувань</h1>
        <p className="text-xl text-gray-600 mb-6">
          Загальна кількість унікальних відвідувачів сайту
        </p>
        <div className="flex justify-center">
          <CustomCard className="text-center w-full max-w-sm p-8">
            <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              {totalViews.toLocaleString()}
            </h3>
            <p className="text-lg font-semibold text-gray-700">
              Унікальних відвідувачів
            </p>
          </CustomCard>
        </div>
      </div>
    </Layout>
  );
};

export default CounterPage;