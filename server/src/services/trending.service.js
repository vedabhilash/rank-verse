import cron from 'node-cron';
import Ranking from '../models/Ranking.js';

/**
 * Calculates the trending score for a ranking using popularity signals and time decay.
 * Formula: ((likes * 3) + (votes * 2) + (comments * 2) + (bookmarks * 2) + (views * 0.1)) / (hoursSinceCreated^1.5 + 2)
 */
export const calculateTrendingScore = (ranking) => {
  const likes = ranking.likesCount || 0;
  
  // Sum votes across all items in this ranking
  const votes = ranking.items ? ranking.items.reduce((acc, item) => acc + (item.voteCount || 0), 0) : 0;
  
  const comments = ranking.commentsCount || 0;
  const bookmarks = ranking.bookmarksCount || 0;
  const views = ranking.viewsCount || 0;

  const hoursSinceCreated = Math.max(0.1, (Date.now() - new Date(ranking.createdAt).getTime()) / (1000 * 60 * 60));

  const popularity = (likes * 3) + (votes * 2) + (comments * 2) + (bookmarks * 2) + (views * 0.1);
  const decay = Math.pow(hoursSinceCreated, 1.5) + 2;

  return popularity / decay;
};

/**
 * Recalculates trending scores for all published rankings in bulk.
 */
export const recalculateAllTrendingScores = async () => {
  try {
    console.log('Running scheduled job: Recalculating trending scores...');
    
    // Process only published rankings
    const rankings = await Ranking.find({ status: 'published' });
    if (rankings.length === 0) {
      console.log('No published rankings to update.');
      return;
    }

    const operations = rankings.map((ranking) => {
      const score = calculateTrendingScore(ranking);
      return {
        updateOne: {
          filter: { _id: ranking._id },
          update: { $set: { trendingScore: score } },
        },
      };
    });

    const result = await Ranking.bulkWrite(operations);
    console.log(`Successfully updated trending scores for ${result.modifiedCount || result.nModified || 0} rankings.`);
  } catch (error) {
    console.error('Error in recalculating trending scores cron job:', error);
  }
};

/**
 * Initializes a cron job that runs every 15 minutes to keep trending scores updated.
 * TRADEOFF NOTE: Recalculating in a scheduled cron job (as done here) scales much better than 
 * calculating on read or writing on every single social action (likes/comments/views).
 * However, the score is slightly eventual-consistent (updates every 15 minutes).
 */
export const startTrendingCron = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    recalculateAllTrendingScores();
  });
  console.log('Trending cron job scheduler initialized (15 min interval).');
};
