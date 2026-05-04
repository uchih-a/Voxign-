import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { InputField } from '../components/ui/InputField';
import { authStore } from '../stores/authStore';
import { authApi } from '../api/auth';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Valid email required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/\d/, 'Password must contain digit'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authStore((state) => state.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchPassword = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Calculate password strength
  useEffect(() => {
    const pwd = watchPassword || '';
    let strength = 0;

    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;

    setPassword(pwd);
    setPasswordStrength(strength);
  }, [watchPassword]);

  const getStrengthColor = (level: number): string => {
    if (level <= 1) return 'bg-status-error';
    if (level === 2) return 'bg-status-warning';
    if (level === 3) return 'bg-accent-soft';
    return 'bg-accent';
  };

  const getStrengthLabel = (level: number): string => {
    if (level <= 1) return 'Weak';
    if (level === 2) return 'Fair';
    if (level === 3) return 'Good';
    return 'Strong';
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const tokens = await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      });

      const user = await authApi.getProfile();

      authStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
      authStore.getState().setUser(user);

      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-glow rounded-full blur-3xl pointer-events-none"
        style={{ opacity: 0.1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassCard className="w-full max-w-md p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 mb-4">
            <h1 className="font-serif text-3xl font-bold text-cream">
              Create Account
            </h1>
            <p className="font-sans text-sm text-cream-muted">
              Join the SignSense community
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <InputField
              label="Full Name"
              type="text"
              placeholder="Your name"
              {...register('fullName')}
              error={errors.fullName?.message}
            />

            {/* Email */}
            <InputField
              label="Email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
            />

            {/* Password */}
            <div>
              <InputField
                label="Password"
                type="password"
                placeholder="••••••••"
                showPasswordToggle
                {...register('password')}
                error={errors.password?.message}
              />

              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 space-y-2"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <motion.div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level <= passwordStrength
                            ? getStrengthColor(passwordStrength)
                            : 'bg-bg-elevated'
                        }`}
                        animate={{ scaleX: level <= passwordStrength ? 1 : 0.8 }}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs font-mono ${
                      passwordStrength <= 1
                        ? 'text-status-error'
                        : passwordStrength === 2
                        ? 'text-status-warning'
                        : passwordStrength === 3
                        ? 'text-accent-soft'
                        : 'text-accent'
                    }`}
                  >
                    {getStrengthLabel(passwordStrength)}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              showPasswordToggle
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-status-error/15 border border-status-error/30 rounded-input text-status-error text-sm"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <PrimaryButton
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Create Account
            </PrimaryButton>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-bg-surface text-cream-muted">or</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block w-full text-center p-3 rounded-btn border border-border-subtle text-cream hover:border-border-active transition-colors"
          >
            Sign in instead
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  );
};
