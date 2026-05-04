import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'letter' | 'word' | 'admin' | 'member';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  letter: 'bg-accent/15 text-accent border border-accent/30',
  word: 'bg-accent/15 text-accent border border-accent/30',
  admin: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
  member: 'bg-accent/15 text-accent border border-accent/30',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'member',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-3 py-1',
        'rounded-pill',
        'font-sans text-xs font-medium',
        'whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
