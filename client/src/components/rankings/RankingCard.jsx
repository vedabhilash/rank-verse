import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Bookmark, Award, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const RankingCard = ({ ranking }) => {
  const {
    _id,
    title,
    category,
    description,
    tags,
    creator,
    items,
    likesCount,
    viewsCount,
    bookmarksCount,
    isCommunitySourced,
    isFeatured,
  } = ranking;

  // Get representative image from the #1 ranked item
  const topItem = items && items.find(item => item.rankNumber === 1);
  const coverImage = topItem?.image?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-sm group hover:border-slate-700/80 transition-colors"
    >
      {/* Cover Image Header */}
      <Link to={`/ranking/${_id}`} className="relative h-44 w-full overflow-hidden block">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
          {isFeatured && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider bg-pink-500/85 text-white backdrop-blur-sm border border-pink-400/30">
              <Award className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
          {isCommunitySourced && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider bg-indigo-500/85 text-white backdrop-blur-sm border border-indigo-400/30">
              <Users className="w-3 h-3" />
              <span>Community</span>
            </span>
          )}
        </div>

        {/* Category tag */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 text-xxs font-semibold border border-slate-850/80 text-indigo-400 capitalize">
          {category}
        </span>
      </Link>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/ranking/${_id}`}>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
            {description || 'No description provided.'}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-xxs px-2 py-0.5 rounded bg-slate-950/40 text-slate-400 border border-slate-850/40">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Metrics & Author */}
        <div className="mt-5 pt-4 border-t border-slate-850/80 flex items-center justify-between text-slate-400">
          {/* Creator Profile */}
          <Link to={`/profile/${creator?._id}`} className="flex items-center space-x-2">
            <img
              src={creator?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=rankverse'}
              alt={creator?.name}
              className="w-6.5 h-6.5 rounded-full object-cover border border-purple-500/60 bg-slate-800"
            />
            <span className="text-xs font-medium text-slate-350 hover:text-indigo-400 truncate max-w-[95px] transition-colors">
              {creator?.name || 'Anonymous'}
            </span>
          </Link>

          {/* Stats indicators */}
          <div className="flex items-center space-x-3 text-xxs">
            <div className="flex items-center space-x-1" title="Views">
              <Eye className="w-3.5 h-3.5" />
              <span>{viewsCount}</span>
            </div>
            <div className="flex items-center space-x-1" title="Likes">
              <Heart className="w-3.5 h-3.5 text-rose-500/80" />
              <span>{likesCount}</span>
            </div>
            <div className="flex items-center space-x-1" title="Bookmarks">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400/80" />
              <span>{bookmarksCount}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RankingCard;
