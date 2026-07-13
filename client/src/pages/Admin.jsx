import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Users, BarChart2, ShieldAlert, Ban, CheckCircle, 
  Database, Eye, Heart, MessageSquare, Award 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../components/common/Avatar';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Guard routing if not admin role
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 1. Fetch dashboard analytics
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics');
      return response.data.analytics;
    },
  });

  // 2. Fetch users management list
  const { data: usersListData, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers', userSearch, userPage],
    queryFn: async () => {
      const response = await api.get('/admin/users', {
        params: { search: userSearch || undefined, page: userPage, limit: 8 },
      });
      return response.data;
    },
  });

  // 3. User Ban Mutation
  const banUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.patch(`/admin/users/${userId}/ban`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
          <ShieldAlert className="w-8 h-8 text-pink-500" />
          <span>Admin Control Console</span>
        </h1>
        <p className="text-sm text-slate-450 mt-1">Monitor site operations, aggregate usage statistics, and moderate accounts</p>
      </div>

      {/* 1. Analytics Cards Overview */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-xl" />
          ))}
        </div>
      ) : analyticsData ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Accounts</p>
              <p className="text-lg font-black text-slate-200">{analyticsData.totalUsers}</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Listings Published</p>
              <p className="text-lg font-black text-slate-200">{analyticsData.totalRankings}</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Votes Cast</p>
              <p className="text-lg font-black text-slate-200">{analyticsData.totalVotes}</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Comments Posted</p>
              <p className="text-lg font-black text-slate-200">{analyticsData.totalComments}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Grid split for Category Stats & User Moderation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* User Moderation Table - left 8 cols */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4.5 h-4.5 text-indigo-400" />
                <span>User Account Moderation</span>
              </h2>

              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search name, email..."
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none"
              />
            </div>

            {loadingUsers ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-10 bg-slate-950/40 rounded" />
                <div className="h-10 bg-slate-950/40 rounded" />
              </div>
            ) : usersListData?.users?.length > 0 ? (
              <div className="overflow-x-auto pr-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase">
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersListData.users.map((item) => (
                      <tr key={item._id} className="border-b border-slate-850/50 hover:bg-slate-950/15 last:border-0">
                        <td className="py-3 flex items-center space-x-2">
                          <Avatar user={item} className="w-7 h-7" sizeText="text-[10px]" />
                          <span className="font-bold text-slate-200">{item.name}</span>
                        </td>
                        <td className="py-3 text-slate-400">{item.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            item.role === 'admin' 
                              ? 'bg-pink-500/10 border-pink-550/25 text-pink-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-450'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => banUserMutation.mutate(item._id)}
                            disabled={item.role === 'admin' || banUserMutation.isPending}
                            className={`px-3 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 ml-auto disabled:opacity-40 ${
                              item.isBanned
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 border border-rose-500/30 text-rose-450 hover:bg-rose-500/25'
                            }`}
                          >
                            {item.isBanned ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Unban</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-6 text-slate-500">No users found.</p>
            )}
          </div>
        </div>

        {/* Category Stats - right 4 cols */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <BarChart2 className="w-4.5 h-4.5 text-indigo-400" />
              <span>Category Distribution</span>
            </h2>

            {loadingAnalytics ? (
              <div className="h-32 bg-slate-950/40 rounded animate-pulse" />
            ) : analyticsData?.categoryStats?.length > 0 ? (
              <div className="space-y-2.5">
                {analyticsData.categoryStats.map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 capitalize font-medium">{stat._id}</span>
                    <span className="bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded text-indigo-400 font-bold">
                      {stat.count} lists
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-slate-500 text-xs">No distribution data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
