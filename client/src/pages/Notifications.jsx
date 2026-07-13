import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageSquare, UserPlus, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../components/common/Avatar';

const Notifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.notifications;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userNotifications']);
    },
  });

  const getNotificationDetails = (notif) => {
    switch (notif.type) {
      case 'like':
        return {
          icon: Heart,
          iconColor: 'text-rose-500 fill-rose-500/10',
          bgColor: 'bg-rose-500/5',
          text: (
            <span>
              <strong>{notif.actor?.name}</strong> liked your standing{' '}
              <Link to={`/ranking/${notif.ranking?._id || notif.ranking?.slug}`} className="font-semibold text-indigo-400 hover:underline">
                "{notif.ranking?.title}"
              </Link>
            </span>
          ),
        };
      case 'comment':
        return {
          icon: MessageSquare,
          iconColor: 'text-cyan-400',
          bgColor: 'bg-cyan-500/5',
          text: (
            <span>
              <strong>{notif.actor?.name}</strong> commented on your standing{' '}
              <Link to={`/ranking/${notif.ranking?._id || notif.ranking?.slug}`} className="font-semibold text-indigo-400 hover:underline">
                "{notif.ranking?.title}"
              </Link>
            </span>
          ),
        };
      case 'follow':
        return {
          icon: UserPlus,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/5',
          text: (
            <span>
              <strong>{notif.actor?.name}</strong> started following you!
            </span>
          ),
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-slate-400',
          bgColor: 'bg-slate-900/10',
          text: <span>System notification update received.</span>,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-450 text-sm">Retrieving notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
          <Bell className="w-7 h-7 text-indigo-400" />
          <span>Notifications</span>
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 border border-slate-850 rounded-xl space-y-2">
          <Bell className="w-8 h-8 text-slate-650 mx-auto" />
          <p className="text-slate-450 text-sm">Your inbox is clear! No new alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, index) => {
            const { icon: Icon, iconColor, bgColor, text } = getNotificationDetails(notif);
            
            return (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                  notif.read
                    ? 'bg-slate-950/20 border-slate-900 text-slate-450'
                    : `border-slate-800 ${bgColor} text-slate-200`
                }`}
              >
                <div className="flex space-x-3.5">
                  <div className={`p-2 rounded-full bg-slate-950 border border-slate-850 ${iconColor} mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Avatar user={notif.actor} className="w-5 h-5" sizeText="text-[8px]" />
                      <p className="text-xs leading-relaxed">{text}</p>
                    </div>
                    <span className="text-[10px] text-slate-550 block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => markReadMutation.mutate(notif._id)}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
