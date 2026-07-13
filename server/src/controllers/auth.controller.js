import User from '../models/User.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { generateAccessToken, generateRefreshToken, sendRefreshTokenCookie } from '../utils/token.js';
import jwt from 'jsonwebtoken';

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400);
      return next(new Error(parseResult.error.errors.map(e => e.message).join(', ')));
    }

    const { name, email, password } = parseResult.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists with this email'));
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, // Pre-save hook hashes this
    });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      sendRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
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
        accessToken,
      });
    } else {
      res.status(400);
      return next(new Error('Invalid user data'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400);
      return next(new Error(parseResult.error.errors.map(e => e.message).join(', ')));
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    if (user.isBanned) {
      res.status(403);
      return next(new Error('Your account has been suspended by administrators.'));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    res.json({
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
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401);
      return next(new Error('No refresh token, authorization denied'));
    }

    let decoded;
    try {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error('JWT_REFRESH_SECRET is required in production');
      }
      decoded = jwt.verify(refreshToken, secret || 'local_jwt_refresh_secret_key_change_me_in_production_67890');
    } catch (err) {
      res.status(401);
      return next(new Error(err.message || 'Invalid refresh token'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const accessToken = generateAccessToken(user._id);
    res.json({
      success: true,
      accessToken,
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

// @desc    Logout user & clear cookie
// @route   POST /api/v1/auth/logout
// @access  Public
export const logout = (req, res, next) => {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
