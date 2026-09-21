const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES
  });
  
  const refreshToken = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES
  });
  
  return { accessToken, refreshToken };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const clearAuthCookies = (res) => {
  const isProd = env.NODE_ENV === 'production';
  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: isProd,
    expires: new Date(0)
  });
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProd,
    expires: new Date(0)
  });
};

module.exports = { generateTokens, setAuthCookies, clearAuthCookies };
