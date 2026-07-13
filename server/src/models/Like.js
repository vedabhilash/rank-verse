import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Enforce unique likes
likeSchema.index({ user: 1, ranking: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

export default Like;
