import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ranking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ranking',
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Enforce one vote per user per item per ranking
voteSchema.index({ user: 1, ranking: 1, item: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

export default Vote;
