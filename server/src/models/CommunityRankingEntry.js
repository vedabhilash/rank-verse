import mongoose from 'mongoose';

const communityRankingEntrySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    normalizedItemKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    representativeImage: {
      url: { type: String, default: '' },
      source: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    totalVotes: {
      type: Number,
      default: 0,
      index: true,
    },
    rankingsIncludedIn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ranking',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Enforce unique entries per category + normalized title key
communityRankingEntrySchema.index({ category: 1, normalizedItemKey: 1 }, { unique: true });

const CommunityRankingEntry = mongoose.model('CommunityRankingEntry', communityRankingEntrySchema);

export default CommunityRankingEntry;
