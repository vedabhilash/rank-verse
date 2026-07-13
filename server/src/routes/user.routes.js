import express from 'express';
import {
  getUserProfile,
  updateOwnProfile,
  toggleFollowUser,
  getUserRankings,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.patch('/me', protect, updateOwnProfile);
router.get('/:id', getUserProfile);
router.post('/:id/follow', protect, toggleFollowUser);
router.get('/:id/rankings', getUserRankings);

export default router;
