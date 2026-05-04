import React from 'react';
import { cn } from '../../utils/cn';

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  PrimaryButtonProps
>(({ children, isLoading = false, fullWidth = false, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={isLoading || props.disabled}
      className={cn(
        'flex items-center justify-center gap-2',
        'min-h-[52px] px-6 py-3',
        'rounded-btn',
        'bg-accent text-bg-primary font-sans font-medium',
        'transition-all duration-200',
        'hover:bg-accent-soft hover:shadow-lg hover:shadow-accent-glow',
        'active:bg-accent-deep',
        'focus-visible:outline-accent focus-visible:outline-3 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

PrimaryButton.displayName = 'PrimaryButton';
