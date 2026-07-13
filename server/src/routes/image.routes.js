import express from 'express';
import { searchImagesController, uploadImageController } from '../controllers/image.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/search', protect, searchRateLimiter, searchImagesController);
router.post('/upload', protect, upload.single('image'), uploadImageController);

export default router;
