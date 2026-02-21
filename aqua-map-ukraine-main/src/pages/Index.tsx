
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import CallToActionSection from '@/components/home/CallToActionSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <StatsSection />
      <CallToActionSection />
    </Layout>
  );
};

export default Index;
