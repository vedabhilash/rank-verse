import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, FileText, Image, Lock, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const settingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters').trim(),
  bio: z.string().max(200, 'Bio must not exceed 200 characters').optional().default(''),
  avatarUrl: z.string().url('Please enter a valid image URL').or(z.string().max(0)).optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters').or(z.string().max(0)).optional(),
});

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const onSubmit = async (data) => {
    setError('');
    setSuccess(false);
    setSubmitting(true);

    // Clean optional empty strings
    const payload = {
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatarUrl || undefined,
    };
    if (data.password) {
      payload.password = data.password;
    }

    const result = await updateProfile(payload);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Profile Settings</h1>
        <p className="text-sm text-slate-450 mt-1">Configure your curator identity and account security details</p>
      </div>

      {success && (
        <div className="p-3.5 text-xs font-semibold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center space-x-1.5">
          <Check className="w-4 h-4" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs font-semibold text-rose-450 bg-rose-500/10 border border-rose-500/20 rounded">
          {error}
        </div>
      )}

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  {...register('name')}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-450 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Avatar Image URL (or leave blank)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
                  <Image className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  {...register('avatarUrl')}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              {errors.avatarUrl && (
                <p className="mt-1 text-xs text-rose-450 font-semibold">{errors.avatarUrl.message}</p>
              )}
            </div>

            {/* Biography */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Biography / Bio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start pointer-events-none text-slate-550">
                  <FileText className="h-4 w-4" />
                </div>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Tell us what lists you love to rank..."
                />
              </div>
              {errors.bio && (
                <p className="mt-1 text-xs text-rose-450 font-semibold">{errors.bio.message}</p>
              )}
            </div>

            <div className="border-t border-slate-850/80 my-4 pt-4" />

            {/* Reset Password */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                Reset Password (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-550"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-450 font-semibold">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-indigo-500/10"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Settings;
