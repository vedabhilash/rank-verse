import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import { initSocket } from './services/socket.service.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { startTrendingCron } from './services/trending.service.js';

import authRoutes from './routes/auth.routes.js';
import rankingRoutes from './routes/ranking.routes.js';
import imageRoutes from './routes/image.routes.js';
import aiRoutes from './routes/ai.routes.js';
import communityRoutes from './routes/community.routes.js';
import trendingRoutes from './routes/trending.routes.js';
import searchRoutes from './routes/search.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import userRoutes from './routes/user.routes.js';
import commentRoutes from './routes/comment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  // Start background cron jobs
  startTrendingCron();
});

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true); // Dynamically allow any requesting origin (essential for credentials: true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Socket.io
initSocket(server, process.env.CLIENT_URL);

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rankings', rankingRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/trending', trendingRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/leaderboards', leaderboardRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root Health Route for Render
app.get('/', (req, res) => {
  res.status(200).send('RankVerse Express Server is running.');
});

// Base Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'RankVerse API is running smoothly',
    timestamp: new Date(),
  });
});

// Catch 404 and forward to error handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
