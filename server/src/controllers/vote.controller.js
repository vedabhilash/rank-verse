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
    const { type: voteType } = req.body;

    if (voteType !== 'upvote' && voteType !== 'downvote') {
      res.status(400);
      return next(new Error('Invalid vote type. Must be upvote or downvote.'));
    }

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

    // 2. Fetch existing vote for the user on this item
    const existingVote = await Vote.findOne({ user: userId, ranking: rankingId, item: itemId });

    let voted = false;
    let netChange = 0;
    let finalVoteType = null;

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Toggle off (remove vote)
        await Vote.deleteOne({ _id: existingVote._id });
        netChange = (voteType === 'upvote') ? -1 : 1;
        voted = false;
        finalVoteType = null;
      } else {
        // Switch vote type
        existingVote.type = voteType;
        await existingVote.save();
        netChange = (voteType === 'upvote') ? 2 : -2;
        voted = true;
        finalVoteType = voteType;
      }
    } else {
      // New vote
      try {
        await Vote.create({ user: userId, ranking: rankingId, item: itemId, type: voteType });
        netChange = (voteType === 'upvote') ? 1 : -1;
        voted = true;
        finalVoteType = voteType;
      } catch (err) {
        if (err.code === 11000) {
          res.status(409);
          return next(new Error('Concurrent vote action. Please retry.'));
        }
        throw err;
      }
    }

    // 3. Atomically update the item's voteCount
    const updatedRanking = await Ranking.findOneAndUpdate(
      { _id: rankingId, "items._id": itemId },
      { $inc: { "items.$.voteCount": netChange } },
      { new: true }
    );

    // 4. Ensure voteCount never goes below 0 (clamping)
    let updatedItem = updatedRanking?.items.id(itemId);
    if (updatedItem && updatedItem.voteCount < 0) {
      updatedItem.voteCount = 0;
      await updatedRanking.save();
    }

    const finalVoteCount = updatedItem ? updatedItem.voteCount : 0;

    // 5. Trigger synchronous aggregation of the community ranking list
    updateCommunityRankingEntry(ranking.category, item.title);

    // 6. Broadcast real-time vote count update to sockets listening to this ranking room
    broadcastVoteUpdate(rankingId, {
      itemId: item._id,
      voteCount: finalVoteCount,
    });

    res.status(200).json({
      success: true,
      voted,
      voteType: finalVoteType,
      voteCount: finalVoteCount,
    });
  } catch (error) {
    next(error);
  }
};
