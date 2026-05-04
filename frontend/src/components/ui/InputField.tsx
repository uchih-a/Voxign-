import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      hint,
      showPasswordToggle = false,
      type = 'text',
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType =
      showPasswordToggle && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-cream-muted mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-3',
              'min-h-[48px] min-w-[16px]',
              'rounded-input',
              'bg-bg-elevated border border-border-subtle',
              'text-cream placeholder-cream-dim',
              'font-sans text-base',
              'transition-all duration-200',
              'hover:border-border-active',
              'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-glow',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-error focus:ring-status-error/25',
              showPasswordToggle && 'pr-10',
              className
            )}
            {...props}
          />

          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'p-1 rounded transition-colors',
                'text-cream-muted hover:text-cream',
                'focus-visible:outline-accent focus-visible:outline-2'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-status-error">{error}</p>
        )}

        {hint && !error && (
          <p className="mt-2 text-sm text-cream-muted">{hint}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
