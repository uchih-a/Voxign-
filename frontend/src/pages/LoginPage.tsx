import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { InputField } from '../components/ui/InputField';
import { authStore } from '../stores/authStore';
import { authApi } from '../api/auth';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authStore((state) => state.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const tokens = await authApi.login(data);
          // ✅ Save tokens FIRST so the interceptor has the access token
       authStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
    
        // ✅ Now getProfile() will send Authorization: Bearer <token>
       const user = await authApi.getProfile();
       authStore.getState().setUser(user);
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
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
        className={shake ? 'animate-pulse' : ''}
      >
        <GlassCard className="w-full max-w-md p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 mb-4">
            <h1 className="font-serif text-3xl font-bold text-cream">
              Welcome back
            </h1>
            <p className="font-sans text-sm text-cream-muted">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <InputField
              label="Email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
            />

            {/* Password */}
            <InputField
              label="Password"
              type="password"
              placeholder="••••••••"
              showPasswordToggle
              {...register('password')}
              error={errors.password?.message}
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <a
                href="#"
                className="text-sm text-accent-soft hover:text-accent transition-colors"
              >
                Forgot password?
              </a>
            </div>

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
              Sign In
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

          {/* Register Link */}
          <Link
            to="/register"
            className="block w-full text-center p-3 rounded-btn border border-border-subtle text-cream hover:border-border-active transition-colors"
          >
            Create account
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  );
};
