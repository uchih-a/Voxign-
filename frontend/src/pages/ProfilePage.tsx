import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { OutlineButton } from '../components/ui/OutlineButton';
import { InputField } from '../components/ui/InputField';
import { Badge } from '../components/ui/Badge';
import { authStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const setUser = authStore((state) => state.setUser); // Ensure you have this action in your authStore
  const { logout } = useAuth();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // --- Profile Update State ---
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  // --- Password Update State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      // TODO: Replace this timeout with your actual API call
      // Example: await api.updateProfile({ full_name: fullName, email });
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      
      // Update global user state if successful (depends on your authStore implementation)
      if (setUser) {
        setUser({ ...user, full_name: fullName, email: email });
      }
      
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in both fields' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage({ type: '', text: '' });
    
    try {
      // TODO: Replace this timeout with your actual API call
      // Example: await api.updatePassword({ current_password: currentPassword, new_password: newPassword });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const initials = (user.full_name ?? '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase();

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <TopBar title="Profile" />

      <div className="max-w-lg mx-auto p-4 space-y-6 pt-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-bg-elevated border-3 border-accent flex items-center justify-center">
              <span className="text-3xl font-bold text-cream">{initials}</span>
            </div>
          </div>

          {/* Name */}
          <h1 className="font-serif text-2xl font-bold text-cream">
            {user.full_name}
          </h1>

          {/* Email */}
          <p className="font-sans text-sm text-cream-muted">{user.email}</p>

          {/* Role & Join Date */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant={user.role?.name === 'admin' ? 'admin' : 'member'}>
              {user.role?.name === 'admin' ? 'Administrator' : 'Member'}
            </Badge>
            <p className="font-sans text-xs text-cream-dim">
              Member since {memberSince}
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions', value: '0' },
            { label: 'Letters', value: '0' },
            { label: 'Words', value: '0' },
          ].map((stat) => (
            <GlassCard key={stat.label} className="p-4 text-center">
              <p className="font-serif text-2xl font-bold text-accent mb-1">
                {stat.value}
              </p>
              <p className="font-sans text-xs text-cream-muted">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Account Details Form */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-cream">
            Account Details
          </h2>

          <InputField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {profileMessage.text && (
            <p className={`text-sm ${profileMessage.type === 'error' ? 'text-status-error' : 'text-status-success'}`}>
              {profileMessage.text}
            </p>
          )}

          <PrimaryButton 
            fullWidth 
            isLoading={isUpdatingProfile} 
            onClick={handleUpdateProfile}
          >
            Save Changes
          </PrimaryButton>
        </GlassCard>

        {/* Security Form */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-cream">
            Security
          </h2>

          <InputField
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <InputField
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {passwordMessage.text && (
            <p className={`text-sm ${passwordMessage.type === 'error' ? 'text-status-error' : 'text-status-success'}`}>
              {passwordMessage.text}
            </p>
          )}

          <OutlineButton 
            fullWidth 
            isLoading={isUpdatingPassword}
            onClick={handleUpdatePassword}
          >
            Update Password
          </OutlineButton>
        </GlassCard>

        {/* Sign Out */}
        {logoutError && (
          <p className="text-sm text-status-error text-center">{logoutError}</p>
        )}
        <motion.button
          whileHover={{ x: 5 }}
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-status-error hover:text-status-error/80 transition-colors font-sans text-sm disabled:opacity-50"
        >
          <LogOut size={16} />
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};