import CommunityRankingEntry from '../models/CommunityRankingEntry.js';

// @desc    Get community ranking Top 10 for a category
// @route   GET /api/v1/community/:category
// @access  Public
export const getCommunityRanking = async (req, res, next) => {
  try {
    const { category } = req.params;

    const entries = await CommunityRankingEntry.find({ category })
      .sort({ totalVotes: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      category,
      count: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
};
