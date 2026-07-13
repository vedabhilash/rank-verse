import express from 'express';
import { getCreatorLeaderboard, getRankingLeaderboard } from '../controllers/trending.controller.js';

const router = express.Router();

router.get('/creators', getCreatorLeaderboard);
router.get('/rankings', getRankingLeaderboard);

export default router;
