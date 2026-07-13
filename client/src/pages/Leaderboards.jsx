import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Award, Heart, Eye, Users, ShieldCheck, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboards = () => {
  const [activeTab, setActiveTab] = useState('creators');

  // Fetch top creators
  const { data: creatorsData, isLoading: loadingCreators } = useQuery({
    queryKey: ['creatorsLeaderboard'],
    queryFn: async () => {
      const response = await api.get('/leaderboards/creators', { params: { limit: 10 } });
      return response.data.creators;
    },
  });

  // Fetch top rankings
  const { data: rankingsData, isLoading: loadingRankings } = useQuery({
    queryKey: ['rankingsLeaderboard'],
    queryFn: async () => {
      const response = await api.get('/leaderboards/rankings', { params: { limit: 10 } });
      return response.data.rankings;
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
          <Award className="w-8 h-8 text-indigo-400" />
          <span>RankVerse Hall of Fame</span>
        </h1>
        <p className="text-sm text-slate-450 mt-1">Discover top curators and most popular standings in our community</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('creators')}
          className={`px-6 py-2.5 font-bold text-sm border-b-2 transition ${
            activeTab === 'creators'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Top Curators
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-6 py-2.5 font-bold text-sm border-b-2 transition ${
            activeTab === 'rankings'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Top Ranking Lists
        </button>
      </div>

      {/* Creators Content */}
      {activeTab === 'creators' && (
        <section className="space-y-4">
          {loadingCreators ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900/60 rounded-xl" />
              ))}
            </div>
          ) : creatorsData && creatorsData.length > 0 ? (
            <div className="space-y-3">
              {creatorsData.map((creator, index) => {
                const rank = index + 1;
                return (
                  <motion.div
                    key={creator._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank Indicator */}
                      <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border ${
                        rank === 1 ? 'bg-amber-500 text-slate-950 border-amber-400' :
                        rank === 2 ? 'bg-slate-300 text-slate-950 border-slate-200' :
                        rank === 3 ? 'bg-amber-700 text-white border-amber-600' :
                        'bg-slate-950 text-slate-500 border-slate-900'
                      }`}>
                        {rank}
                      </span>

                      {/* Avatar */}
                      <img
                        src={creator.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=rankverse'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-purple-500/50 bg-slate-800"
                      />

                      <div>
                        <Link to={`/profile/${creator._id}`} className="font-bold text-slate-200 hover:text-indigo-400 flex items-center space-x-1">
                          <span>{creator.name}</span>
                          {creator.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                        </Link>
                        {/* Bio / Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {creator.badges && creator.badges.slice(0, 2).map((badge, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="flex items-center space-x-6 text-slate-400 text-xxs">
                      <div className="text-center">
                        <p className="font-bold text-slate-200 text-sm">{creator.stats?.rankingsCreated || 0}</p>
                        <p className="text-[10px] text-slate-500">Lists</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-200 text-sm flex items-center justify-center space-x-0.5">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
                          <span>{creator.stats?.totalLikes || 0}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-200 text-sm flex items-center justify-center space-x-0.5">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{creator.stats?.totalViews || 0}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Views</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-slate-500 text-sm">No curators listed.</p>
          )}
        </section>
      )}

      {/* Rankings Content */}
      {activeTab === 'rankings' && (
        <section className="space-y-4">
          {loadingRankings ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900/60 rounded-xl" />
              ))}
            </div>
          ) : rankingsData && rankingsData.length > 0 ? (
            <div className="space-y-3">
              {rankingsData.map((ranking, index) => {
                const rank = index + 1;
                const cover = ranking.items?.[0]?.image?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
                return (
                  <motion.div
                    key={ranking._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank Indicator */}
                      <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border ${
                        rank === 1 ? 'bg-amber-500 text-slate-950 border-amber-400' :
                        rank === 2 ? 'bg-slate-300 text-slate-950 border-slate-200' :
                        rank === 3 ? 'bg-amber-700 text-white border-amber-600' :
                        'bg-slate-950 text-slate-500 border-slate-900'
                      }`}>
                        {rank}
                      </span>

                      {/* Mini Thumbnail */}
                      <div className="w-10 h-10 rounded overflow-hidden bg-slate-950 border border-slate-800">
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div>
                        <Link to={`/ranking/${ranking._id}`} className="font-bold text-slate-200 hover:text-indigo-400">
                          {ranking.title}
                        </Link>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Category: <span className="text-slate-400 capitalize">{ranking.category}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="flex items-center space-x-4 text-slate-400 text-xxs">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{ranking.viewsCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>{ranking.likesCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{ranking.bookmarksCount}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-slate-500 text-sm">No ranking lists found.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default Leaderboards;
