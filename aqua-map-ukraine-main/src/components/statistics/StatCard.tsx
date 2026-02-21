import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, children }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative flex-grow flex items-center justify-center p-4">
        {children}
        <img
          src="/img/cropped-Ukrfish_logo-300x60.png"
          alt="Watermark"
          className="absolute top-2 right-2 opacity-20 w-24 h-auto"
        />
      </CardContent>
    </Card>
  );
};

export default StatCard;
