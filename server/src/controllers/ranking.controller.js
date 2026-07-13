import Ranking from '../models/Ranking.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import { rankingCreateSchema } from '../utils/validation.js';
import { createNotification } from '../services/notification.service.js';
import mongoose from 'mongoose';

// @desc    Create a ranking
// @route   POST /api/v1/rankings
// @access  Private
export const createRanking = async (req, res, next) => {
  try {
    const parseResult = rankingCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400);
      return next(new Error(parseResult.error.errors.map(e => e.message).join(', ')));
    }

    const { title, category, description, tags, items, isCommunitySourced } = parseResult.data;

    const ranking = await Ranking.create({
      title,
      category,
      description,
      tags,
      items,
      isCommunitySourced,
      creator: req.user._id,
    });

    // Increment rankingsCreated count for the user
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.rankingsCreated': 1 },
    });

    res.status(201).json({
      success: true,
      ranking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rankings (with search, category, tags, sort, and pagination)
// @route   GET /api/v1/rankings
// @access  Public
export const getRankings = async (req, res, next) => {
  try {
    const { search, category, tags, sort, page = 1, limit = 10 } = req.query;

    const query = { status: 'published' };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tags filter
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagsArray };
    }

    // Determine sorting
    let sortOption = { createdAt: -1 }; // default is latest
    if (sort === 'trending') {
      sortOption = { trendingScore: -1 };
    } else if (sort === 'popular') {
      sortOption = { likesCount: -1 };
    } else if (sort === 'views') {
      sortOption = { viewsCount: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const rankings = await Ranking.find(query)
      .populate('creator', 'name avatarUrl bio stats')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skipIndex);

    const total = await Ranking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: rankings.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalRankings: total,
      rankings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ranking by ID or Slug
// @route   GET /api/v1/rankings/:id
// @access  Public
export const getRankingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let ranking;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ranking = await Ranking.findOne({ _id: id, status: { $ne: 'removed' } }).populate('creator', 'name avatarUrl bio badges stats');
    } else {
      ranking = await Ranking.findOne({ slug: id, status: { $ne: 'removed' } }).populate('creator', 'name avatarUrl bio badges stats');
    }

    if (!ranking) {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    res.status(200).json({
      success: true,
      ranking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ranking
// @route   PATCH /api/v1/rankings/:id
// @access  Private (Owner only)
export const updateRanking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking) {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    // Ensure user is creator
    if (ranking.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('User not authorized to update this ranking'));
    }

    // Only let update draft or published. Do not allow editing removed ones.
    if (ranking.status === 'removed') {
      res.status(400);
      return next(new Error('Cannot update a removed ranking'));
    }

    // We can validate partial ranking data, or full data depending on the design. Let's do simple updates
    const { title, category, description, tags, items, isCommunitySourced, status } = req.body;

    if (title) ranking.title = title;
    if (category) ranking.category = category;
    if (description) ranking.description = description;
    if (tags) ranking.tags = tags;
    if (items) ranking.items = items;
    if (typeof isCommunitySourced === 'boolean') ranking.isCommunitySourced = isCommunitySourced;
    if (status) ranking.status = status;

    await ranking.save();

    res.status(200).json({
      success: true,
      ranking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Soft-remove ranking
// @route   DELETE /api/v1/rankings/:id
// @access  Private (Owner or Admin)
export const deleteRanking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking) {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    // Ensure user is owner or admin
    if (ranking.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('User not authorized to delete this ranking'));
    }

    // Soft remove by setting status to removed
    if (ranking.status !== 'removed') {
      ranking.status = 'removed';
      await ranking.save();

      // Decrement rankingsCreated count for creator
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.rankingsCreated': -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ranking removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on ranking
// @route   POST /api/v1/rankings/:id/like
// @access  Private
export const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking || ranking.status === 'removed') {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    const alreadyLiked = await Like.findOne({ user: req.user._id, ranking: id });

    if (alreadyLiked) {
      // Unlike
      await Like.deleteOne({ _id: alreadyLiked._id });
      
      ranking.likesCount = Math.max(0, ranking.likesCount - 1);
      await ranking.save();

      // Decrement creator's stats
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.totalLikes': -1 },
      });

      res.status(200).json({
        success: true,
        liked: false,
        likesCount: ranking.likesCount,
      });
    } else {
      // Like
      await Like.create({ user: req.user._id, ranking: id });

      ranking.likesCount += 1;
      await ranking.save();

      // Increment creator's stats
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.totalLikes': 1 },
      });

      // Send Notification to creator
      await createNotification({
        recipient: ranking.creator,
        type: 'like',
        actor: req.user._id,
        ranking: ranking._id,
      });

      res.status(200).json({
        success: true,
        liked: true,
        likesCount: ranking.likesCount,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark on ranking
// @route   POST /api/v1/rankings/:id/bookmark
// @access  Private
export const toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking || ranking.status === 'removed') {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    const alreadyBookmarked = await Bookmark.findOne({ user: req.user._id, ranking: id });

    if (alreadyBookmarked) {
      // Remove bookmark
      await Bookmark.deleteOne({ _id: alreadyBookmarked._id });
      
      ranking.bookmarksCount = Math.max(0, ranking.bookmarksCount - 1);
      await ranking.save();

      res.status(200).json({
        success: true,
        bookmarked: false,
        bookmarksCount: ranking.bookmarksCount,
      });
    } else {
      // Add bookmark
      await Bookmark.create({ user: req.user._id, ranking: id });

      ranking.bookmarksCount += 1;
      await ranking.save();

      res.status(200).json({
        success: true,
        bookmarked: true,
        bookmarksCount: ranking.bookmarksCount,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Increment views on ranking
// @route   POST /api/v1/rankings/:id/view
// @access  Public
export const incrementViews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ranking = await Ranking.findById(id);

    if (!ranking || ranking.status === 'removed') {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    ranking.viewsCount += 1;
    await ranking.save();

    // Increment creator's total views
    await User.findByIdAndUpdate(ranking.creator, {
      $inc: { 'stats.totalViews': 0.1 }, // we can count 1 view or fractional view, let's count 1 full view for totalViews
    });
    
    // Actually, let's increment totalViews by 1 in creator stats
    await User.findByIdAndUpdate(ranking.creator, {
      $inc: { 'stats.totalViews': 1 },
    });

    res.status(200).json({
      success: true,
      viewsCount: ranking.viewsCount,
    });
  } catch (error) {
    next(error);
  }
};
