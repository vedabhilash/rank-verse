import Ranking from '../models/Ranking.js';
import Vote from '../models/Vote.js';
import CommunityRankingEntry from '../models/CommunityRankingEntry.js';
import { normalizeKey } from '../utils/slug.js';

/**
 * Recomputes the aggregated CommunityRankingEntry for a given category and item title.
 * This runs synchronously on each vote cast/removed.
 * Upgrade path: In high-traffic scenarios, this should be offloaded to a debounced queue 
 * or a scheduled background worker.
 */
export const updateCommunityRankingEntry = async (category, itemTitle) => {
  try {
    const normalizedKey = normalizeKey(itemTitle);

    // 1. Find all published rankings in this category
    const rankings = await Ranking.find({ category, status: 'published' });

    // 2. Locate all items matching the normalized item title
    const matchingItemIds = [];
    const rankingIdsIncluded = [];
    let representativeTitle = itemTitle;
    let representativeImage = { url: '', source: '', publicId: '' };
    let maxItemVotes = -1;

    for (const ranking of rankings) {
      for (const item of ranking.items) {
        if (normalizeKey(item.title) === normalizedKey) {
          matchingItemIds.push(item._id);
          rankingIdsIncluded.push(ranking._id);

          // Use the metadata (title, image) of the item with the highest votes as representative
          if (item.voteCount > maxItemVotes) {
            maxItemVotes = item.voteCount;
            representativeTitle = item.title;
            if (item.image && item.image.url) {
              representativeImage = {
                url: item.image.url,
                source: item.image.source,
                publicId: item.image.publicId,
              };
            }
          }
        }
      }
    }

    // 3. Count total actual votes cast across all matched item IDs
    const totalVotes = await Vote.countDocuments({ item: { $in: matchingItemIds } });

    if (totalVotes === 0) {
      // Clean up if there are no votes left for this item
      await CommunityRankingEntry.deleteOne({ category, normalizedItemKey: normalizedKey });
      console.log(`Cleaned up community ranking entry for key: ${normalizedKey} due to 0 votes.`);
    } else {
      // Upsert the CommunityRankingEntry
      await CommunityRankingEntry.findOneAndUpdate(
        { category, normalizedItemKey: normalizedKey },
        {
          title: representativeTitle,
          representativeImage,
          totalVotes,
          rankingsIncludedIn: rankingIdsIncluded,
        },
        { upsert: true, new: true }
      );
      console.log(`Upserted community entry for ${representativeTitle} in category ${category} with ${totalVotes} votes.`);
    }
  } catch (error) {
    console.error('Error updating community ranking entry:', error);
  }
};
