import Comment from '../models/Comment.js';
import Ranking from '../models/Ranking.js';
import { createNotification } from '../services/notification.service.js';

// @desc    Add comment to a ranking
// @route   POST /api/v1/rankings/:id/comments
// @access  Private
export const createComment = async (req, res, next) => {
  try {
    const { id: rankingId } = req.params;
    const { text, parentComment } = req.body;

    if (!text || text.trim() === '') {
      res.status(400);
      return next(new Error('Comment text is required'));
    }

    const ranking = await Ranking.findById(rankingId);
    if (!ranking || ranking.status === 'removed') {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    // Handle optional parent comment checking
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        res.status(404);
        return next(new Error('Parent comment not found'));
      }
    }

    const comment = await Comment.create({
      ranking: rankingId,
      author: req.user._id,
      text,
      parentComment: parentComment || null,
    });

    // Populate author details
    const populatedComment = await comment.populate('author', 'name avatarUrl bio badges');

    // Increment comment count on ranking
    ranking.commentsCount += 1;
    await ranking.save();

    // Trigger notification
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.author.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: parent.author,
          type: 'comment',
          actor: req.user._id,
          ranking: ranking._id,
        });
      }
    } else {
      if (ranking.creator.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: ranking.creator,
          type: 'comment',
          actor: req.user._id,
          ranking: ranking._id,
        });
      }
    }

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a ranking
// @route   GET /api/v1/rankings/:id/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const { id: rankingId } = req.params;

    const rankingExists = await Ranking.exists({ _id: rankingId, status: { $ne: 'removed' } });
    if (!rankingExists) {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    // Retrieve comments, sort older to newer (to structure replies chronologically)
    const comments = await Comment.find({ ranking: rankingId })
      .populate('author', 'name avatarUrl bio badges')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/v1/comments/:id
// @access  Private (Author or Admin)
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    // Check ownership or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('User not authorized to delete this comment'));
    }

    // Find and count recursive replies to decrement properly
    const replies = await Comment.find({ parentComment: id });
    const replyIds = replies.map(r => r._id);
    const deleteIds = [id, ...replyIds];

    const deleteCount = deleteIds.length;

    await Comment.deleteMany({ _id: { $in: deleteIds } });

    // Decrement commentsCount on ranking
    await Ranking.findByIdAndUpdate(comment.ranking, {
      $inc: { commentsCount: -deleteCount },
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCount: deleteCount,
    });
  } catch (error) {
    next(error);
  }
};
