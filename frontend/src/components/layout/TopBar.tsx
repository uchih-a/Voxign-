import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../utils/cn';

interface TopBarProps {
  title: string;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBackButton = false,
  rightElement,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <GlassCard className={cn(
      'sticky top-0 z-40 rounded-b-card rounded-t-none',
      'flex items-center justify-between px-4 py-3',
      'border-b border-l border-r border-border-subtle',
      className
    )}>
      <div className="flex items-center gap-2 flex-1">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'flex items-center justify-center',
              'min-h-[48px] min-w-[48px]',
              'rounded-btn',
              'text-cream-muted hover:text-cream',
              'transition-colors duration-200',
              'focus-visible:outline-accent focus-visible:outline-2'
            )}
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="font-serif text-lg font-bold text-cream truncate">
          {title}
        </h1>
      </div>

      {rightElement && (
        <div className="flex items-center justify-end flex-shrink-0">
          {rightElement}
        </div>
      )}
    </GlassCard>
  );
};
