import express from 'express';
import { describeImageController, generateImageController } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/describe-image', protect, aiRateLimiter, describeImageController);
router.post('/generate-image', protect, aiRateLimiter, generateImageController);

export default router;
