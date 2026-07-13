import express from 'express';
import {
  getUsers,
  toggleBanUser,
  deleteRankingAdmin,
  toggleFeatureRanking,
  getAnalytics,
} from '../controllers/admin.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect & admin middlewares to all admin routes
router.use(protect, admin);

router.get('/users', getUsers);
router.patch('/users/:id/ban', toggleBanUser);
router.delete('/rankings/:id', deleteRankingAdmin);
router.patch('/rankings/:id/feature', toggleFeatureRanking);
router.get('/analytics', getAnalytics);

export default router;
