import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import RankingCard from '../components/rankings/RankingCard';
import { Sparkles, TrendingUp, Compass, Award, ArrowRight, Library, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { name: 'movies', label: 'Movies & TV', icon: '🎬', bg: 'from-pink-500/20 to-purple-500/10 border-pink-500/30' },
  { name: 'gaming', label: 'Gaming', icon: '🎮', bg: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30' },
  { name: 'sports', label: 'Sports & Athletics', icon: '⚽', bg: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30' },
  { name: 'tech', label: 'Tech & Gadgets', icon: '💻', bg: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30' },
  { name: 'travel', label: 'Travel & Places', icon: '✈️', bg: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30' },
  { name: 'music', label: 'Music & Audio', icon: '🎵', bg: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30' },
  { name: 'food', label: 'Food & Dining', icon: '🍔', bg: 'from-rose-500/20 to-orange-500/10 border-rose-500/30' },
  { name: 'general', label: 'General / Other', icon: '✨', bg: 'from-slate-550/20 to-slate-800/10 border-slate-700/30' },
];

const Home = () => {
  // Fetch trending rankings
  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['trendingRankings'],
    queryFn: async () => {
      const response = await api.get('/trending', { params: { limit: 6 } });
      return response.data.rankings;
    },
  });

  // Fetch featured rankings
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featuredRankings'],
    queryFn: async () => {
      // Fetch rankings and grab featured ones, or sort by popular
      const response = await api.get('/rankings', { params: { sort: 'popular', limit: 3 } });
      return response.data.rankings;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-slate-900/20 border border-slate-850 p-8 sm:p-12 text-center space-y-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community-Driven Standings</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            The Ultimate Arena for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Top 10 Rankings
            </span>
          </h1>
          
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Create lists on any topic, vote on entries, and watch the community ranking engine merge votes into live, global category leaderboards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/create"
              className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-650 hover:opacity-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 text-sm"
            >
              <span>Build Your List</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/explore"
              className="w-full sm:w-auto px-6 py-3 rounded-full font-bold bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition flex items-center justify-center space-x-2 text-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Standings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Live Community Leaderboards Directory */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Live Global Top 10s</h2>
          </div>
          <p className="text-xs text-slate-400">Select a category to view the aggregated community results</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/community/${cat.name}`}
              className={`p-4 rounded-xl border bg-gradient-to-br ${cat.bg} hover:scale-[1.02] active:scale-95 transition-all duration-200 group flex flex-col justify-between h-28`}
            >
              <span className="text-3xl">{cat.icon}</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-250 group-hover:text-white transition-colors capitalize">
                  {cat.label}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-450 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Spotlight Section */}
      {featuredData && featuredData.length > 0 && (
        <section className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-bold text-slate-100 font-sans">Popular Standings</h2>
            </div>
            <Link to="/explore?sort=popular" className="text-xs text-indigo-400 font-semibold hover:underline">
              See All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingFeatured
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-72 bg-slate-900/60 rounded-xl animate-pulse" />
                ))
              : featuredData.map((ranking) => (
                  <RankingCard key={ranking._id} ranking={ranking} />
                ))}
          </div>
        </section>
      )}

      {/* 4. Trending Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Rising Trends</h2>
          </div>
          <Link to="/trending" className="text-xs text-indigo-400 font-semibold hover:underline">
            View All Trending
          </Link>
        </div>

        {loadingTrending ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-slate-900/60 rounded-xl" />
            ))}
          </div>
        ) : trendingData && trendingData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingData.map((ranking) => (
              <RankingCard key={ranking._id} ranking={ranking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/20 border border-slate-850 rounded-xl">
            <Library className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No rankings created yet. Be the first to build a list!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
