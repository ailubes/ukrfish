'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Users, Ship } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import waterData from '@/data/vodni_obiekty_1748944527.json';
import fishPortsData from '@/data/fish_ports.json';
import { WaterBasin } from '@/types/waterBasin';

const StatsSection = () => {
  const [stats, setStats] = useState({
    totalObjects: 0,
    uniqueUsers: 0,
    totalFishPorts: 0,
  });

  useEffect(() => {
    const waterObjectsData = waterData as WaterBasin[];
    const uniqueLessees = new Set(waterObjectsData.map(basin => basin.lesseeName)).size;

    const totalFishPorts = Object.values(fishPortsData).reduce(
      (acc, regionPorts) => acc + regionPorts.length,
      0
    );

    setStats({
      totalObjects: waterObjectsData.length,
      uniqueUsers: uniqueLessees,
      totalFishPorts: totalFishPorts,
    });
  }, []);

  const statCards = [
    {
      icon: Building2,
      title: 'Загальна кількість об\'єктів',
      value: stats.totalObjects,
      description: 'Водних об\'єктів в базі даних',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      title: 'Унікальних користувачів аквакультури',
      value: stats.uniqueUsers,
      description: 'Орендарів водних ресурсів',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Ship,
      title: 'Кількість місць базування суден рибного господарства',
      value: stats.totalFishPorts,
      description: 'Загальна кількість місць в базі',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Статистика платформи
          </h2>
          <p className="text-xl text-gray-600">
            Актуальні дані про водні ресурси України
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statCards.map((stat, index) => (
            <CustomCard key={index} hover className="text-center p-6">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${stat.gradient} mb-4`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {stat.title}
              </p>
              <p className="text-gray-600">
                {stat.description}
              </p>
            </CustomCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
