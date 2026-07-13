import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_ACCESS_SECRET is required in production');
  }
  return jwt.sign({ id: userId }, secret || 'local_jwt_access_secret_key_change_me_in_production_12345', {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_REFRESH_SECRET is required in production');
  }
  return jwt.sign({ id: userId }, secret || 'local_jwt_refresh_secret_key_change_me_in_production_67890', {
    expiresIn: '7d',
  });
};

export const sendRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};
