
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { // Extend with HTMLDivElement attributes to include ref
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const CustomCard = forwardRef<HTMLDivElement, CardProps>(({ children, className, hover = false, ...props }, ref) => {
  return (
    <div 
      ref={ref} // Pass the forwarded ref to the div
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-200',
        hover && 'hover:shadow-xl hover:scale-105 transition-all duration-300',
        className
      )}
      {...props} // Pass any other props
    >
      {children}
    </div>
  );
});

CustomCard.displayName = 'CustomCard'; // Add display name for better debugging

export default CustomCard;
