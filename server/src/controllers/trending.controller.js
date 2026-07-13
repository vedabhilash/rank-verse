import Ranking from '../models/Ranking.js';
import User from '../models/User.js';

// @desc    Get top trending rankings
// @route   GET /api/v1/trending
// @access  Public
export const getTrending = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const rankings = await Ranking.find({ status: 'published' })
      .populate('creator', 'name avatarUrl bio stats')
      .sort({ trendingScore: -1 })
      .limit(parseInt(limit))
      .skip(skipIndex);

    const total = await Ranking.countDocuments({ status: 'published' });

    res.status(200).json({
      success: true,
      count: rankings.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      rankings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global search (rankings or users)
// @route   GET /api/v1/search
// @access  Public
export const getSearch = async (req, res, next) => {
  try {
    const { q = '', type = 'rankings', page = 1, limit = 10 } = req.query;
    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const regexQuery = { $regex: q, $options: 'i' };

    if (type === 'users') {
      const query = {
        $or: [
          { name: regexQuery },
          { bio: regexQuery },
        ],
      };

      const users = await User.find(query)
        .select('name email avatarUrl bio stats badges')
        .limit(parseInt(limit))
        .skip(skipIndex);

      const total = await User.countDocuments(query);

      return res.status(200).json({
        success: true,
        type: 'users',
        count: users.length,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        results: users,
      });
    } else {
      // Default type: rankings
      const query = {
        status: 'published',
        $or: [
          { title: regexQuery },
          { description: regexQuery },
          { tags: regexQuery },
        ],
      };

      const rankings = await Ranking.find(query)
        .populate('creator', 'name avatarUrl bio stats')
        .limit(parseInt(limit))
        .skip(skipIndex);

      const total = await Ranking.countDocuments(query);

      return res.status(200).json({
        success: true,
        type: 'rankings',
        count: rankings.length,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        results: rankings,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get top creators leaderboard
// @route   GET /api/v1/leaderboards/creators
// @access  Public
export const getCreatorLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const creators = await User.find({})
      .select('name avatarUrl bio badges stats')
      // Sort creators by likesCount first, then view count, then rankings created
      .sort({
        'stats.totalLikes': -1,
        'stats.totalViews': -1,
        'stats.rankingsCreated': -1,
      })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: creators.length,
      creators,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top rankings leaderboard
// @route   GET /api/v1/leaderboards/rankings
// @access  Public
export const getRankingLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, criteria = 'likes' } = req.query;

    let sortCriteria = { likesCount: -1 };
    if (criteria === 'views') {
      sortCriteria = { viewsCount: -1 };
    } else if (criteria === 'bookmarks') {
      sortCriteria = { bookmarksCount: -1 };
    }

    const rankings = await Ranking.find({ status: 'published' })
      .populate('creator', 'name avatarUrl bio stats')
      .sort(sortCriteria)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: rankings.length,
      rankings,
    });
  } catch (error) {
    next(error);
  }
};
