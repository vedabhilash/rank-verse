import User from '../models/User.js';
import Ranking from '../models/Ranking.js';
import Vote from '../models/Vote.js';
import Comment from '../models/Comment.js';

// @desc    Get all users (Admin only)
// @route   GET /api/v1/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skipIndex);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban/Unban user (Admin only)
// @route   PATCH /api/v1/admin/users/:id/ban
// @access  Private (Admin only)
export const toggleBanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Prevent administrators from banning themselves or other admins
    if (user.role === 'admin') {
      res.status(400);
      return next(new Error('Administrators cannot be banned.'));
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      isBanned: user.isBanned,
      message: `User has been successfully ${user.isBanned ? 'banned' : 'unbanned'}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin soft-remove ranking
// @route   DELETE /api/v1/admin/rankings/:id
// @access  Private (Admin only)
export const deleteRankingAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking) {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    if (ranking.status !== 'removed') {
      ranking.status = 'removed';
      await ranking.save();

      // Decrement user stats rankings count
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.rankingsCreated': -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ranking removed by Admin successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle feature status of ranking
// @route   PATCH /api/v1/admin/rankings/:id/feature
// @access  Private (Admin only)
export const toggleFeatureRanking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking || ranking.status === 'removed') {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    ranking.isFeatured = !ranking.isFeatured;
    await ranking.save();

    res.status(200).json({
      success: true,
      isFeatured: ranking.isFeatured,
      message: `Ranking featured status updated to: ${ranking.isFeatured}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics (Admin only)
// @route   GET /api/v1/admin/analytics
// @access  Private (Admin only)
export const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalRankings, totalVotes, totalComments] = await Promise.all([
      User.countDocuments({}),
      Ranking.countDocuments({ status: 'published' }),
      Vote.countDocuments({}),
      Comment.countDocuments({}),
    ]);

    // Aggregate category counts
    const categoryStats = await Ranking.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalRankings,
        totalVotes,
        totalComments,
        categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
