import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_ACCESS_SECRET;
      if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error('JWT_ACCESS_SECRET is required in production');
      }
      const decoded = jwt.verify(token, secret || 'local_jwt_access_secret_key_change_me_in_production_12345');

      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        res.status(401);
        return next(new Error('Not authorized, user not found'));
      }
      
      return next();
    } catch (error) {
      res.status(401);
      return next(new Error(error.message || 'Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};

export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_ACCESS_SECRET;
      if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error('JWT_ACCESS_SECRET is required in production');
      }
      const decoded = jwt.verify(token, secret || 'local_jwt_access_secret_key_change_me_in_production_12345');
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (error) {
      console.warn('Optional auth token validation failed:', error.message);
    }
  }

  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    return next(new Error('Not authorized as an admin'));
  }
};
