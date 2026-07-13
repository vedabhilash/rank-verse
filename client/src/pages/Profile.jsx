import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RankingCard from '../components/rankings/RankingCard';
import { UserPlus, UserMinus, Heart, Eye, Award, Settings, FolderHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../components/common/Avatar';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);

  const isSelf = currentUser?._id === id;

  // 1. Fetch profile details
  const { data: profile, isLoading: loadingProfile, isError: profileError } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data.user;
    },
  });

  // 2. Fetch user's rankings
  const { data: userRankings = [], isLoading: loadingRankings } = useQuery({
    queryKey: ['userRankings', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/rankings`);
      return response.data.rankings;
    },
  });

  // Initialize follow status
  useEffect(() => {
    if (profile && currentUser) {
      const follows = profile.followers.some(f => f._id === currentUser._id || f === currentUser._id);
      setIsFollowing(follows);
    }
  }, [profile, currentUser]);

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/users/${id}/follow`);
      return response.data;
    },
    onSuccess: (data) => {
      setIsFollowing(data.followed);
      queryClient.invalidateQueries(['userProfile', id]);
    },
  });

  if (loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-450 text-sm">Loading profile details...</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-450 font-bold">User profile not found.</p>
        <Link to="/" className="text-indigo-400 mt-2 block hover:underline">
          Go back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Bio Section */}
      <section className="bg-slate-900/40 border border-slate-850 p-6 sm:p-8 rounded-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
            <Avatar user={profile} className="w-24 h-24" sizeText="text-3xl" />
            
            <div className="space-y-2.5">
              <h1 className="text-2xl font-black text-slate-100 flex items-center justify-center md:justify-start space-x-2">
                <span>{profile.name}</span>
              </h1>
              
              <p className="text-slate-400 text-sm max-w-md">{profile.bio || 'This curator hasn\'t added a biography yet.'}</p>

              {/* Badges achievement badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {profile.badges && profile.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-xxs font-semibold"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action trigger button */}
          <div className="flex items-center justify-center pt-2 md:pt-0">
            {isSelf ? (
              <Link
                to="/settings"
                className="flex items-center space-x-1.5 px-4 py-2 border border-slate-800 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            ) : currentUser ? (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition ${
                  isFollowing
                    ? 'bg-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow Curator</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-850/80 text-center text-slate-400 text-xxs">
          <div className="bg-slate-950/20 border border-slate-850/60 p-3 rounded-xl">
            <p className="font-extrabold text-slate-200 text-lg">{profile.stats?.rankingsCreated || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Lists Created</p>
          </div>
          <div className="bg-slate-950/20 border border-slate-850/60 p-3 rounded-xl">
            <p className="font-extrabold text-slate-200 text-lg flex items-center justify-center space-x-0.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
              <span>{profile.stats?.totalLikes || 0}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total Likes</p>
          </div>
          <div className="bg-slate-950/20 border border-slate-850/60 p-3 rounded-xl">
            <p className="font-extrabold text-slate-200 text-lg flex items-center justify-center space-x-0.5">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>{profile.stats?.totalViews || 0}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total Views</p>
          </div>
          <div className="bg-slate-950/20 border border-slate-850/60 p-3 rounded-xl">
            <p className="font-extrabold text-slate-200 text-lg">{profile.followers?.length || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Followers</p>
          </div>
          <div className="bg-slate-950/20 border border-slate-850/60 p-3 rounded-xl col-span-2 sm:col-span-1">
            <p className="font-extrabold text-slate-200 text-lg">{profile.following?.length || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Following</p>
          </div>
        </div>
      </section>

      {/* User rankings grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-1.5">
          <FolderHeart className="w-5 h-5 text-indigo-400" />
          <span>Curated Standings</span>
        </h2>

        {loadingRankings ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 bg-slate-900/60 rounded-xl" />
            ))}
          </div>
        ) : userRankings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userRankings.map((ranking) => (
              <RankingCard key={ranking._id} ranking={ranking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-slate-850 rounded-xl bg-slate-900/10">
            <p className="text-xs text-slate-550">This user hasn't published any ranking lists yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
