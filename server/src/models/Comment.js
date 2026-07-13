import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    ranking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ranking',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Please provide comment text'],
      trim: true,
      maxlength: [1000, 'Comment text cannot exceed 1000 characters'],
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
