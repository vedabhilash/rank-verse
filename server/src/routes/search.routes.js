import express from 'express';
import { getSearch } from '../controllers/trending.controller.js';

const router = express.Router();

router.get('/', getSearch);

export default router;
