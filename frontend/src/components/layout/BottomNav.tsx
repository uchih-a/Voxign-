import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  History,
  User,
  Settings,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { authStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard', requiresAuth: true },
  { icon: History, label: 'History', href: '/history', requiresAuth: true },
  { icon: User, label: 'Profile', href: '/profile', requiresAuth: true },
  { icon: Settings, label: 'Admin', href: '/admin', requiresAuth: true, adminOnly: true },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isAdmin = authStore((state) => state.isAdmin());

  return (
    <GlassCard className="fixed bottom-0 inset-x-0 rounded-t-card rounded-b-none border-t border-l border-r border-border-subtle p-2">
      <nav
        className="flex justify-around items-stretch"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          // Skip admin link if not admin
          if (item.adminOnly && !isAdmin) return null;

          const Icon = item.icon;
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'min-h-[60px] flex-1',
                'rounded-btn',
                'transition-colors duration-200',
                'text-xs font-mono',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-cream-muted hover:text-cream'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </GlassCard>
  );
};
