import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';

const rankingItemSchema = new mongoose.Schema(
  {
    rankNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      url: { type: String, default: '' },
      source: {
        type: String,
        enum: ['upload', 'pexels', 'pixabay', 'ai-generated'],
        default: 'upload',
      },
      publicId: { type: String, default: '' },
    },
    aiGenerated: {
      description: { type: Boolean, default: false },
      tags: { type: Boolean, default: false },
      image: { type: Boolean, default: false },
    },
    voteCount: {
      type: Number,
      default: 0,
    },
  }
);

const rankingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      index: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      index: true,
      default: [],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [rankingItemSchema],
    isCommunitySourced: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    trendingScore: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'removed'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-slugify title pre-save
rankingSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    let slugCandidate = slugify(this.title);
    
    // Check uniqueness and handle collision
    const RankingModel = this.constructor;
    let count = 0;
    let existingSlug = await RankingModel.findOne({ slug: slugCandidate });
    
    while (existingSlug && existingSlug._id.toString() !== this._id.toString()) {
      count++;
      slugCandidate = `${slugify(this.title)}-${count}`;
      existingSlug = await RankingModel.findOne({ slug: slugCandidate });
    }
    
    this.slug = slugCandidate;
  }
  
  // Keep items sorted by rank number
  if (this.items && this.items.length > 0) {
    this.items.sort((a, b) => a.rankNumber - b.rankNumber);
  }
  
  next();
});

const Ranking = mongoose.model('Ranking', rankingSchema);

export default Ranking;
export { rankingItemSchema };
