import express from 'express';
import {
  createRanking,
  getRankings,
  getRankingById,
  updateRanking,
  deleteRanking,
  toggleLike,
  toggleBookmark,
  incrementViews,
} from '../controllers/ranking.controller.js';
import { castVote } from '../controllers/vote.controller.js';
import { createComment, getComments } from '../controllers/comment.controller.js';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createRanking)
  .get(getRankings);

router.route('/:id')
  .get(optionalProtect, getRankingById)
  .patch(protect, updateRanking)
  .delete(protect, deleteRanking);

router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/view', incrementViews);
router.post('/:id/items/:itemId/vote', protect, castVote);

router.route('/:id/comments')
  .post(protect, createComment)
  .get(getComments);

export default router;
