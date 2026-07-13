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

    // 2. Check if vote already exists
    const existingVote = await Vote.findOne({ user: userId, ranking: rankingId, item: itemId });

    let voted = false;

    if (existingVote) {
      // User has already voted -> Remove Vote (Toggle off)
      await Vote.deleteOne({ _id: existingVote._id });
      item.voteCount = Math.max(0, item.voteCount - 1);
      voted = false;
    } else {
      // User hasn't voted yet -> Add Vote (Toggle on)
      await Vote.create({ user: userId, ranking: rankingId, item: itemId });
      item.voteCount += 1;
      voted = true;
    }

    // 3. Save the modified ranking document
    await ranking.save();

    // 4. Trigger synchronous aggregation of the community ranking list
    // (runs in background so it doesn't block the HTTP response)
    updateCommunityRankingEntry(ranking.category, item.title);

    // 5. Broadcast real-time vote count update to sockets listening to this ranking room
    broadcastVoteUpdate(rankingId, {
      itemId: item._id,
      voteCount: item.voteCount,
    });

    res.status(200).json({
      success: true,
      voted,
      voteCount: item.voteCount,
    });
  } catch (error) {
    next(error);
  }
};
