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

// Shared by every cookie this server sets, so clearing matches setting.
const cookieBase = () => {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
  };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieBase(),
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieBase(),
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const clearAuthCookies = (res) => {
  res.cookie('accessToken', '', { ...cookieBase(), expires: new Date(0) });
  res.cookie('refreshToken', '', { ...cookieBase(), expires: new Date(0) });
};

module.exports = { generateTokens, setAuthCookies, clearAuthCookies };
