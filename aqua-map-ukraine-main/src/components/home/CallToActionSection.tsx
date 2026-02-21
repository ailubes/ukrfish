
'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import CustomCard from '@/components/ui/CustomCard';

const CallToActionSection = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Text content */}
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Приєднуйся до спільноти аквакультури України
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Досліджуй водні ресурси, знаходь нові можливості для розвитку 
              рибного господарства та ділись власним досвідом з іншими користувачами.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-blue-100">Інтерактивна мапа з геолокацією</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-blue-100">Детальна інформація про кожен об'єкт</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-blue-100">Можливість додавати нові об'єкти</span>
              </div>
            </div>
          </div>

          {/* Right side - Action cards */}
          <div className="space-y-6">
            <CustomCard className="text-center p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Досліджуй водні об'єкти
              </h3>
              <p className="text-gray-600 mb-6">
                Переглядай водні об'єкти на інтерактивній мапі, 
                фільтруй за параметрами та знаходь цікаві можливості.
              </p>
              <Link to="/objects">
                <CustomButton size="lg" className="w-full group">
                  <span>Переглянути об'єкти</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </CustomButton>
              </Link>
            </CustomCard>

            <CustomCard className="text-center p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Додай новий об'єкт
              </h3>
              <p className="text-gray-600 mb-6">
                Знаєш про водний об'єкт, якого немає в нашій базі? 
                Поділись інформацією з спільнотою.
              </p>
              <Link to="/suggest">
                <CustomButton variant="secondary" size="lg" className="w-full group">
                  <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                  <span>Додати об'єкт</span>
                </CustomButton>
              </Link>
            </CustomCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
