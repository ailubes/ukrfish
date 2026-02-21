
'use client';

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Fish } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
const HeroSection = () => {
  return (
    <section className="relative h-[600px] overflow-hidden flex items-center justify-center bg-blue-500">
      <div className="relative z-10 container mx-auto text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Hero Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Відкрий водні ресурси України!
          </h1>
          
          {/* Hero Subtitle */}
          <p className="text-xl md:text-2xl mb-8 leading-relaxed">
            Аквакультура України на одній мапі. 
            Знайди інформацію про водні об'єкти, досліджуй можливості, розвивай рибне господарство.
          </p>

          {/* Hero Icons */}
          <div className="flex justify-center items-center space-x-8 mb-12">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8" />
              <span className="text-lg font-medium">Інтерактивна мапа</span>
            </div>
            <div className="flex items-center space-x-2">
              <Fish className="h-8 w-8" />
              <span className="text-lg font-medium">База водних об'єктів</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/objects">
              <CustomButton size="lg" className="w-full sm:w-auto px-8 py-4">
                Переглянути об'єкти
              </CustomButton>
            </Link>
            <Link to="/suggest">
              <CustomButton variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4">
                Додати об'єкт
              </CustomButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
