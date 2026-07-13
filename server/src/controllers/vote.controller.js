import Ranking from '../models/Ranking.js';
import Vote from '../models/Vote.js';
import { updateCommunityRankingEntry } from '../services/ranking.service.js';
import { broadcastVoteUpdate } from '../services/socket.service.js';

// @desc    Cast or remove a vote on a ranking item
// @route   POST /api/v1/rankings/:id/items/:itemId/vote
// @access  Private
export const castVote = async (req, res, next) => {
  try {
    const { id: rankingId, itemId } = req.params;
    const userId = req.user._id;

    // 1. Fetch ranking and check item existence
    const ranking = await Ranking.findById(rankingId);
    if (!ranking || ranking.status === 'removed') {
      res.status(404);
      return next(new Error('Ranking not found'));
    }

    const item = ranking.items.id(itemId);
    if (!item) {
      res.status(404);
      return next(new Error('Ranking item not found'));
    }

    // 2. Try to delete the vote first (Toggle off)
    const deleteResult = await Vote.deleteOne({ user: userId, ranking: rankingId, item: itemId });

    let voted = false;
    let newVoteCount = 0;

    if (deleteResult.deletedCount > 0) {
      // Vote removed! Atomically decrement item voteCount
      const updatedRanking = await Ranking.findOneAndUpdate(
        { _id: rankingId, "items._id": itemId },
        { $inc: { "items.$.voteCount": -1 } },
        { new: true }
      );
      const updatedItem = updatedRanking?.items.id(itemId);
      newVoteCount = updatedItem ? Math.max(0, updatedItem.voteCount) : 0;
      voted = false;
    } else {
      // User hasn't voted yet -> Add Vote (Toggle on)
      try {
        await Vote.create({ user: userId, ranking: rankingId, item: itemId });
        
        const updatedRanking = await Ranking.findOneAndUpdate(
          { _id: rankingId, "items._id": itemId },
          { $inc: { "items.$.voteCount": 1 } },
          { new: true }
        );
        const updatedItem = updatedRanking?.items.id(itemId);
        newVoteCount = updatedItem ? updatedItem.voteCount : 1;
        voted = true;
      } catch (err) {
        if (err.code === 11000) {
          // Handle concurrent vote insert
          const currentRanking = await Ranking.findById(rankingId);
          const currentItem = currentRanking?.items.id(itemId);
          newVoteCount = currentItem ? currentItem.voteCount : 1;
          voted = true;
        } else {
          throw err;
        }
      }
    }

    // 3. Trigger synchronous aggregation of the community ranking list
    // (runs in background so it doesn't block the HTTP response)
    updateCommunityRankingEntry(ranking.category, item.title);

    // 4. Broadcast real-time vote count update to sockets listening to this ranking room
    broadcastVoteUpdate(rankingId, {
      itemId: item._id,
      voteCount: newVoteCount,
    });

    res.status(200).json({
      success: true,
      voted,
      voteCount: newVoteCount,
    });
  } catch (error) {
    next(error);
  }
};
