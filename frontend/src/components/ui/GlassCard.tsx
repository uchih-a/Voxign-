import React from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-card bg-bg-surface/50 border border-border-subtle backdrop-blur-md',
        'transition-all duration-200 hover:border-border-active',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
