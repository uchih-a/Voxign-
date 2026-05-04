import React from 'react';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { GlassCard } from '../components/ui/GlassCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { authStore } from '../stores/authStore';

export const AdminPage: React.FC = () => {
  const isAdmin = authStore((state) => state.isAdmin());

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <h1 className="font-serif text-xl font-bold text-cream mb-2">
            Access Denied
          </h1>
          <p className="font-sans text-sm text-cream-muted">
            You do not have permission to view this page.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <TopBar title="Admin Dashboard" />

      <div className="max-w-4xl mx-auto p-4 space-y-6 pt-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Users', value: '0', color: 'border-accent' },
            { label: 'Active Users', value: '0', color: 'border-accent' },
            { label: 'Total Sessions', value: '0', color: 'border-accent' },
            { label: 'Sessions Today', value: '0', color: 'border-status-warning' },
          ].map((metric) => (
            <GlassCard
              key={metric.label}
              className={`p-4 border-t-4 border-b border-transparent ${metric.color}`}
            >
              <p className="font-serif text-2xl font-bold text-accent mb-1">
                {metric.value}
              </p>
              <p className="font-sans text-xs text-cream-muted">
                {metric.label}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Users Table Placeholder */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-cream">Users</h2>

          <div className="flex justify-center py-12">
            <div className="text-center space-y-2">
              <LoadingSpinner size="lg" />
              <p className="font-sans text-sm text-cream-muted">
                Loading users...
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
};
