import User from '../models/User.js';
import Ranking from '../models/Ranking.js';
import { createNotification } from '../services/notification.service.js';

// @desc    Get user profile by ID
// @route   GET /api/v1/users/:id
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-passwordHash')
      .populate('followers', 'name avatarUrl bio stats')
      .populate('following', 'name avatarUrl bio stats');

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PATCH /api/v1/users/me
// @access  Private
export const updateOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const { name, bio, avatarUrl, password } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (password) user.passwordHash = password; // Pre-save pre hook will encrypt passwordHash

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        badges: user.badges,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow or unfollow a user
// @route   POST /api/v1/users/:id/follow
// @access  Private
export const toggleFollowUser = async (req, res, next) => {
  try {
    const { id: followUserId } = req.params;
    const currentUserId = req.user._id;

    if (followUserId.toString() === currentUserId.toString()) {
      res.status(400);
      return next(new Error('You cannot follow yourself'));
    }

    const userToFollow = await User.findById(followUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isFollowing = currentUser.following.includes(followUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(followUserId);
      userToFollow.followers.pull(currentUserId);
      await currentUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        followed: false,
      });
    } else {
      // Follow
      currentUser.following.addToSet(followUserId);
      userToFollow.followers.addToSet(currentUserId);
      await currentUser.save();
      await userToFollow.save();

      // Trigger follow notification
      await createNotification({
        recipient: followUserId,
        type: 'follow',
        actor: currentUserId,
      });

      res.status(200).json({
        success: true,
        followed: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get rankings created by a specific user
// @route   GET /api/v1/users/:id/rankings
// @access  Public
export const getUserRankings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rankings = await Ranking.find({ creator: id, status: 'published' })
      .populate('creator', 'name avatarUrl stats')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rankings.length,
      rankings,
    });
  } catch (error) {
    next(error);
  }
};
