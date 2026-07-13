import express from 'express';
import { deleteComment } from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.delete('/:id', protect, deleteComment);

export default router;
