import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Heart, Eye, Bookmark, Share2, Award, Users, 
  MessageSquare, Send, Trash2, ArrowUpCircle, Check, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/common/Avatar';

const RankingDetail = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { joinRankingRoom, leaveRankingRoom, socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [userLikes, setUserLikes] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState(false);
  const [votedItems, setVotedItems] = useState(new Set());

  // 1. Fetch ranking details
  const { data: ranking, isLoading, isError } = useQuery({
    queryKey: ['rankingDetail', id],
    queryFn: async () => {
      const response = await api.get(`/rankings/${id}`);
      return response.data.ranking;
    },
    enabled: !authLoading,
  });

  // 2. Fetch comments list
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['rankingComments', id],
    queryFn: async () => {
      const response = await api.get(`/rankings/${id}/comments`);
      return response.data.comments;
    },
  });

  // Increments viewsCount on mount once
  useEffect(() => {
    if (id) {
      api.post(`/rankings/${id}/view`).catch(err => console.error(err));
    }
  }, [id]);

  // Join Socket.io room on mount, leave on unmount
  useEffect(() => {
    if (ranking?._id) {
      joinRankingRoom(ranking._id);
      return () => {
        leaveRankingRoom(ranking._id);
      };
    }
  }, [ranking?._id]);

  // Listen to Socket.IO real-time vote updates
  useEffect(() => {
    if (socket) {
      const handleVoteUpdate = (data) => {
        const { itemId, voteCount } = data;
        queryClient.setQueryData(['rankingDetail', id], (oldData) => {
          if (!oldData) return oldData;
          const updatedItems = oldData.items.map((item) => {
            if (item._id === itemId) {
              return { ...item, voteCount };
            }
            return item;
          });
          return { ...oldData, items: updatedItems };
        });
      };

      socket.on('vote_update', handleVoteUpdate);
      return () => {
        socket.off('vote_update', handleVoteUpdate);
      };
    }
  }, [socket, id, queryClient]);

  // Check if current user liked/bookmarked or voted
  useEffect(() => {
    if (ranking) {
      setUserLikes(ranking.userInteractions?.liked || false);
      setUserBookmarks(ranking.userInteractions?.bookmarked || false);
      setVotedItems(new Set(ranking.userInteractions?.votedItemIds || []));
    } else {
      setUserLikes(false);
      setUserBookmarks(false);
      setVotedItems(new Set());
    }
  }, [ranking]);

  // Likes Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/rankings/${ranking._id}/like`);
      return response.data;
    },
    onSuccess: (data) => {
      setUserLikes(data.liked);
      queryClient.setQueryData(['rankingDetail', id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, likesCount: data.likesCount };
      });
    },
  });

  // Bookmarks Mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/rankings/${ranking._id}/bookmark`);
      return response.data;
    },
    onSuccess: (data) => {
      setUserBookmarks(data.bookmarked);
      queryClient.setQueryData(['rankingDetail', id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, bookmarksCount: data.bookmarksCount };
      });
    },
  });

  // Voting Mutation
  const toggleVoteMutation = useMutation({
    mutationFn: async (itemId) => {
      const response = await api.post(`/rankings/${ranking._id}/items/${itemId}/vote`);
      return { itemId, data: response.data };
    },
    onSuccess: ({ itemId, data }) => {
      // Toggle voted item locally
      setVotedItems(prev => {
        const next = new Set(prev);
        if (data.voted) {
          next.add(itemId);
        } else {
          next.delete(itemId);
        }
        return next;
      });
      // Update cache
      queryClient.setQueryData(['rankingDetail', id], (oldData) => {
        if (!oldData) return oldData;
        const updatedItems = oldData.items.map((item) => {
          if (item._id === itemId) {
            return { ...item, voteCount: data.voteCount };
          }
          return item;
        });
        return { ...oldData, items: updatedItems };
      });
    },
  });

  // Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(`/rankings/${ranking._id}/comments`, payload);
      return response.data;
    },
    onSuccess: () => {
      setCommentText('');
      setReplyToId(null);
      queryClient.invalidateQueries(['rankingComments', id]);
      queryClient.setQueryData(['rankingDetail', id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, commentsCount: oldData.commentsCount + 1 };
      });
    },
  });

  // Comment Delete Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await api.delete(`/comments/${commentId}`);
      return { commentId, count: response.data.deletedCount };
    },
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries(['rankingComments', id]);
      queryClient.setQueryData(['rankingDetail', id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, commentsCount: Math.max(0, oldData.commentsCount - count) };
      });
    },
  });

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;

    addCommentMutation.mutate({
      text: commentText.trim(),
      parentComment: replyToId,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-450 text-sm">Retrieving standings...</p>
      </div>
    );
  }

  if (isError || !ranking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-450 font-bold">List not found or removed.</p>
        <Link to="/explore" className="text-indigo-400 mt-2 block hover:underline">
          Go back to Explore
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Detail */}
      <section className="bg-slate-900/35 border border-slate-850 p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center space-x-2 mb-3">
          <span className="px-2.5 py-0.5 rounded bg-slate-950 text-xxs font-bold uppercase tracking-wider text-indigo-400">
            {ranking.category}
          </span>
          {ranking.isFeatured && (
            <span className="flex items-center space-x-0.5 px-2.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xxs font-bold uppercase tracking-wider border border-pink-500/20">
              <Award className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
          {ranking.isCommunitySourced && (
            <span className="flex items-center space-x-0.5 px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xxs font-bold uppercase tracking-wider border border-indigo-500/20">
              <Users className="w-3 h-3" />
              <span>Community Sourced</span>
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-100 leading-tight">{ranking.title}</h1>
        
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          {ranking.description || 'No description provided.'}
        </p>

        {/* Creator Info and stats */}
        <div className="mt-6 pt-4 border-t border-slate-850/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${ranking.creator?._id}`} className="flex items-center space-x-2 group">
              <Avatar user={ranking.creator} className="w-8 h-8" sizeText="text-xs" />
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                  {ranking.creator?.name || 'Anonymous'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {ranking.creator?.badges?.[0] || 'Contributor'}
                </p>
              </div>
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-xxs text-slate-500">
              Published {new Date(ranking.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Social Indicators */}
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-950/40 border border-slate-850/60 text-xxs">
              <Eye className="w-3.5 h-3.5" />
              <span>{ranking.viewsCount} Views</span>
            </div>

            {/* Like */}
            <button
              onClick={() => {
                if (!user) navigate('/login');
                else toggleLikeMutation.mutate();
              }}
              disabled={toggleLikeMutation.isPending}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-xxs disabled:opacity-50 ${
                userLikes
                  ? 'bg-rose-500/10 border-rose-500/35 text-rose-400'
                  : 'bg-slate-950/40 border-slate-850/60 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${userLikes ? 'fill-current' : ''}`} />
              <span>{ranking.likesCount} Likes</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={() => {
                if (!user) navigate('/login');
                else toggleBookmarkMutation.mutate();
              }}
              disabled={toggleBookmarkMutation.isPending}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-xxs disabled:opacity-50 ${
                userBookmarks
                  ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400'
                  : 'bg-slate-950/40 border-slate-850/60 hover:text-indigo-400'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${userBookmarks ? 'fill-current' : ''}`} />
              <span>{ranking.bookmarksCount} Bookmarks</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-slate-950/40 border border-slate-850/60 hover:text-indigo-400 transition"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Top 10 list items */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 font-sans tracking-wide">Top 10 Standings</h2>
        
        <div className="space-y-4">
          {ranking.items && ranking.items.map((item, index) => {
            const isVoted = votedItems.has(item._id);
            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-1 md:grid-cols-12 bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-sm group hover:border-slate-800 transition"
              >
                {/* Image Section */}
                <div className="col-span-12 md:col-span-4 h-48 md:h-full relative overflow-hidden bg-slate-950">
                  {item.image?.url ? (
                    <img
                      src={item.image.url}
                      alt={item.title}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-101"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <span>No Image</span>
                    </div>
                  )}

                  {/* Rank number block */}
                  <div className="absolute top-0 left-0 bg-indigo-600 text-white font-extrabold text-sm px-4 py-2 border-br border-slate-800 rounded-br-2xl flex items-center space-x-1 shadow-md shadow-indigo-500/20">
                    <span className="text-xs text-indigo-200">#</span>
                    <span>{item.rankNumber}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="col-span-12 md:col-span-8 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-100">{item.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.description || 'No description provided.'}</p>
                  </div>

                  {/* Voting UI panel */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-850/60">
                    <div className="flex items-center space-x-2 text-xxs text-slate-500">
                      <span className="bg-slate-950 px-2.5 py-1 rounded text-slate-400 font-semibold border border-slate-850/60">
                        {item.voteCount} Votes
                      </span>
                    </div>

                    {ranking.isCommunitySourced && (() => {
                      const isThisItemLoading = toggleVoteMutation.isPending && toggleVoteMutation.variables === item._id;
                      return (
                        <button
                          onClick={() => {
                            if (!user) navigate('/login');
                            else toggleVoteMutation.mutate(item._id);
                          }}
                          disabled={toggleVoteMutation.isPending}
                          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full font-bold text-xs transition duration-200 disabled:opacity-50 ${
                            isVoted
                              ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400'
                              : 'bg-indigo-600 hover:bg-indigo-750 text-white shadow shadow-indigo-500/10'
                          }`}
                        >
                          {isThisItemLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Voting...</span>
                            </>
                          ) : isVoted ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Devote</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                              <span>Upvote</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. Comments block */}
      <section className="bg-slate-900/35 border border-slate-850 p-6 rounded-2xl space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-850 pb-3">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <span>Comments ({ranking.commentsCount})</span>
        </h2>

        {/* Comment input form */}
        <form onSubmit={handlePostComment} className="space-y-3">
          {replyToId && (
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded text-xxs border border-slate-850">
              <span className="text-indigo-400 font-semibold">Replying to nested comment</span>
              <button
                type="button"
                onClick={() => setReplyToId(null)}
                className="text-slate-500 hover:text-slate-350"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              placeholder={user ? "Share your opinion..." : "Sign in to post comments..."}
              disabled={!user}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full pl-4 pr-12 py-3 text-xs bg-slate-950 border border-slate-850 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!user || !commentText.trim() || addCommentMutation.isPending}
              className="absolute inset-y-0 right-2 pr-3 flex items-center text-indigo-500 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Comments listings list */}
        {loadingComments ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-slate-950/60 rounded" />
            <div className="h-10 bg-slate-950/60 rounded" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {/* Filter top level comments */}
            {comments.filter(c => !c.parentComment).map((comment) => (
              <div key={comment._id} className="space-y-3 border-b border-slate-850/45 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3">
                    <Avatar user={comment.author} className="w-7 h-7" sizeText="text-[10px]" />
                    <div>
                      <div className="flex items-center space-x-2 text-xxs">
                        <span className="font-bold text-slate-200">{comment.author?.name}</span>
                        <span className="text-slate-650">•</span>
                        <span className="text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{comment.text}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReplyToId(comment._id)}
                      className="text-xxs font-semibold text-slate-500 hover:text-indigo-400"
                    >
                      Reply
                    </button>
                    {(user && (comment.author?._id === user._id || user.role === 'admin')) && (
                      <button
                        onClick={() => deleteCommentMutation.mutate(comment._id)}
                        className="text-rose-500 hover:bg-rose-500/10 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub Replies level */}
                {comments.filter(c => c.parentComment === comment._id).map((reply) => (
                  <div key={reply._id} className="pl-10 flex items-start justify-between group">
                    <div className="flex space-x-2">
                      <Avatar user={reply.author} className="w-5.5 h-5.5" sizeText="text-[9px]" />
                      <div>
                        <div className="flex items-center space-x-2 text-xxs">
                          <span className="font-bold text-slate-200">{reply.author?.name}</span>
                          <span className="text-slate-650">•</span>
                          <span className="text-slate-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-350 mt-0.5">{reply.text}</p>
                      </div>
                    </div>

                    {(user && (reply.author?._id === user._id || user.role === 'admin')) && (
                      <button
                        onClick={() => deleteCommentMutation.mutate(reply._id)}
                        className="text-rose-550 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 p-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500">No opinions shared yet. Start the conversation!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RankingDetail;
