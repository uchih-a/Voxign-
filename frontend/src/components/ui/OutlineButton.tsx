import React from 'react';
import { cn } from '../../utils/cn';

interface OutlineButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const OutlineButton = React.forwardRef<
  HTMLButtonElement,
  OutlineButtonProps
>(({ children, fullWidth = false, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'flex items-center justify-center gap-2',
        'min-h-[52px] px-6 py-3',
        'rounded-btn',
        'bg-transparent border-2 border-cream text-cream font-sans font-medium',
        'transition-all duration-200',
        'hover:border-accent-soft hover:text-accent-soft hover:bg-bg-elevated',
        'active:bg-bg-elevated/80',
        'focus-visible:outline-accent focus-visible:outline-3 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

OutlineButton.displayName = 'OutlineButton';
