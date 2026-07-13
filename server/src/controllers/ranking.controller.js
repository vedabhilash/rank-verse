import Ranking from '../models/Ranking.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import Vote from '../models/Vote.js';
import { rankingCreateSchema, rankingUpdateSchema } from '../utils/validation.js';
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

    let userInteractions = { liked: false, bookmarked: false, votedItemIds: [] };

    if (req.user) {
      const [liked, bookmarked, votes] = await Promise.all([
        Like.exists({ user: req.user._id, ranking: ranking._id }),
        Bookmark.exists({ user: req.user._id, ranking: ranking._id }),
        Vote.find({ user: req.user._id, ranking: ranking._id }).select('item'),
      ]);

      userInteractions = {
        liked: !!liked,
        bookmarked: !!bookmarked,
        votedItemIds: votes.map(v => v.item.toString()),
      };
    }

    res.status(200).json({
      success: true,
      ranking: {
        ...ranking.toObject(),
        userInteractions,
      },
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

    const parseResult = rankingUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400);
      return next(new Error(parseResult.error.errors.map(e => e.message).join(', ')));
    }

    const { title, category, description, tags, items, isCommunitySourced, status } = parseResult.data;

    // Handle soft-removal and decrement stats if marked removed
    if (status === 'removed' && ranking.status !== 'removed') {
      ranking.status = 'removed';
      await ranking.save();

      // Decrement rankingsCreated count for creator
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.rankingsCreated': -1 },
      });
    } else {
      if (title) ranking.title = title;
      if (category) ranking.category = category;
      if (description) ranking.description = description;
      if (tags) ranking.tags = tags;
      if (items) ranking.items = items;
      if (typeof isCommunitySourced === 'boolean') ranking.isCommunitySourced = isCommunitySourced;
      if (status) ranking.status = status;
      await ranking.save();
    }

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

    const deleteResult = await Like.deleteOne({ user: req.user._id, ranking: id });

    if (deleteResult.deletedCount > 0) {
      // Unlike
      const updatedRanking = await Ranking.findByIdAndUpdate(
        id,
        { $inc: { likesCount: -1 } },
        { new: true }
      );
      
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.totalLikes': -1 },
      });

      res.status(200).json({
        success: true,
        liked: false,
        likesCount: updatedRanking ? Math.max(0, updatedRanking.likesCount) : 0,
      });
    } else {
      // Like
      try {
        await Like.create({ user: req.user._id, ranking: id });

        const updatedRanking = await Ranking.findByIdAndUpdate(
          id,
          { $inc: { likesCount: 1 } },
          { new: true }
        );

        await User.findByIdAndUpdate(ranking.creator, {
          $inc: { 'stats.totalLikes': 1 },
        });

        await createNotification({
          recipient: ranking.creator,
          type: 'like',
          actor: req.user._id,
          ranking: ranking._id,
        });

        res.status(200).json({
          success: true,
          liked: true,
          likesCount: updatedRanking ? updatedRanking.likesCount : 1,
        });
      } catch (err) {
        if (err.code === 11000) {
          const currentRanking = await Ranking.findById(id);
          return res.status(200).json({
            success: true,
            liked: true,
            likesCount: currentRanking ? currentRanking.likesCount : 1,
          });
        }
        throw err;
      }
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

    const deleteResult = await Bookmark.deleteOne({ user: req.user._id, ranking: id });

    if (deleteResult.deletedCount > 0) {
      // Remove bookmark
      const updatedRanking = await Ranking.findByIdAndUpdate(
        id,
        { $inc: { bookmarksCount: -1 } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        bookmarked: false,
        bookmarksCount: updatedRanking ? Math.max(0, updatedRanking.bookmarksCount) : 0,
      });
    } else {
      // Add bookmark
      try {
        await Bookmark.create({ user: req.user._id, ranking: id });

        const updatedRanking = await Ranking.findByIdAndUpdate(
          id,
          { $inc: { bookmarksCount: 1 } },
          { new: true }
        );

        res.status(200).json({
          success: true,
          bookmarked: true,
          bookmarksCount: updatedRanking ? updatedRanking.bookmarksCount : 1,
        });
      } catch (err) {
        if (err.code === 11000) {
          const currentRanking = await Ranking.findById(id);
          return res.status(200).json({
            success: true,
            bookmarked: true,
            bookmarksCount: currentRanking ? currentRanking.bookmarksCount : 1,
          });
        }
        throw err;
      }
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

    const cookieName = `viewed_ranking_${id}`;

    if (!req.cookies[cookieName]) {
      ranking.viewsCount += 1;
      await ranking.save();

      // Increment creator's total views by 1
      await User.findByIdAndUpdate(ranking.creator, {
        $inc: { 'stats.totalViews': 1 },
      });

      // Set cookie for 15 minutes (900000 ms) to deduplicate views
      res.cookie(cookieName, 'true', { maxAge: 900000, httpOnly: true });
    }

    res.status(200).json({
      success: true,
      viewsCount: ranking.viewsCount,
    });
  } catch (error) {
    next(error);
  }
};
