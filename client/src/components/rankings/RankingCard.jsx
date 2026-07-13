import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Bookmark, Award, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../common/Avatar';

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
      className="flex flex-col bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-sm group hover:border-slate-800 transition shadow-lg shadow-black/75"
    >
      {/* Cover Image Header */}
      <Link to={`/ranking/${_id}`} className="relative h-44 w-full overflow-hidden block">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
          {isFeatured && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider bg-black/55 text-pink-400 border border-pink-500/30">
              <Award className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
          {isCommunitySourced && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider bg-black/55 text-teal-400 border border-teal-500/30">
              <Users className="w-3 h-3" />
              <span>Community</span>
            </span>
          )}
        </div>

        {/* Category tag */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/55 text-xxs font-semibold border border-slate-800/60 text-slate-350 capitalize">
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
                <span key={idx} className="text-xxs px-2 py-0.5 rounded bg-slate-950/30 text-slate-450 border border-slate-850/60">
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
            <Avatar user={creator} className="w-6 h-6" sizeText="text-[10px]" />
            <span className="text-xxs uppercase tracking-wider font-semibold text-slate-300 hover:text-indigo-400 truncate max-w-[95px] transition-colors">
              {creator?.name || 'Anonymous'}
            </span>
          </Link>

          {/* Stats indicators */}
          <div className="flex items-center space-x-3 text-xxs text-slate-400">
            <div className="flex items-center space-x-1" title="Views">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{viewsCount}</span>
            </div>
            <div className="flex items-center space-x-1" title="Likes">
              <Heart className="w-3.5 h-3.5 text-slate-500" />
              <span>{likesCount}</span>
            </div>
            <div className="flex items-center space-x-1" title="Bookmarks">
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>{bookmarksCount}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RankingCard;
