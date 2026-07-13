import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Trophy, HelpCircle, Users, LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels = {
  movies: 'Movies & TV',
  gaming: 'Gaming',
  sports: 'Sports',
  tech: 'Tech & Gadgets',
  travel: 'Travel & Destinations',
  music: 'Music & Audio',
  food: 'Food & Dining',
  general: 'General Topic Standings',
};

const CommunityCategory = () => {
  const { category } = useParams();

  const { data: communityData, isLoading, isError } = useQuery({
    queryKey: ['communityCategory', category],
    queryFn: async () => {
      const response = await api.get(`/community/${category}`);
      return response.data;
    },
  });

  const categoryName = categoryLabels[category] || 'Category';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-450 text-sm">Aggregating community rankings...</p>
      </div>
    );
  }

  if (isError || !communityData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-450 font-bold">Error retrieving community category data.</p>
        <Link to="/" className="text-indigo-400 mt-2 block hover:underline">
          Go back to Home
        </Link>
      </div>
    );
  }

  const entries = communityData.entries || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Category Hero Header */}
      <section className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/10 border border-slate-850 p-8 rounded-2xl relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Trophy className="w-3.5 h-3.5" />
            <span>Official Community Standings</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Global Top 10:{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent capitalize">
              {categoryName}
            </span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            This leaderboard is compiled dynamically by summing votes cast on matching entries across all user-created lists.
          </p>
        </div>
      </section>

      {/* Standings lists */}
      <section className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 border border-slate-850 rounded-xl space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-sm">No votes have been cast in this category yet.</p>
            <Link
              to="/explore"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition shadow-md shadow-indigo-500/15"
            >
              <span>Explore lists & vote</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => {
              const rankNumber = index + 1;
              const repImage = entry.representativeImage?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
              
              // Custom rank color rings
              const rankColors = 
                rankNumber === 1 ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/10' : 
                rankNumber === 2 ? 'bg-slate-300 text-slate-950 border-slate-200' :
                rankNumber === 3 ? 'bg-amber-700 text-white border-amber-600' :
                'bg-slate-900 text-slate-400 border-slate-800';

              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-4 rounded-xl backdrop-blur-sm group hover:border-slate-800 transition"
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank Circle */}
                    <span className={`w-8 h-8 rounded-full border text-sm font-black flex items-center justify-center ${rankColors}`}>
                      {rankNumber}
                    </span>

                    {/* Entry Thumbnail */}
                    <div className="w-12 h-12 rounded overflow-hidden bg-slate-950 border border-slate-850">
                      <img src={repImage} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {entry.title}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <LayoutList className="w-3 h-3 text-indigo-400/80" />
                          <span>Appears in {entry.rankingsIncludedIn?.length || 0} lists</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vote Count indicator */}
                  <div className="text-right">
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      <span>{entry.totalVotes} Votes</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CommunityCategory;
