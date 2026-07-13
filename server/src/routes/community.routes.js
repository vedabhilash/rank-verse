import express from 'express';
import { getCommunityRanking } from '../controllers/community.controller.js';

const router = express.Router();

router.get('/:category', getCommunityRanking);

export default router;
