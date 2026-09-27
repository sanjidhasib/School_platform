const express = require('express');
const { register, login, logout, getMe, changePassword, refresh, session } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginValidator, changePasswordValidator, registerValidator } = require('../validators/auth.validators');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', loginLimiter, registerValidator, register);
router.post('/login', loginLimiter, loginValidator, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/session', session);
router.get('/me', verifyToken, getMe);
router.patch('/change-password', verifyToken, changePasswordValidator, changePassword);

module.exports = router;
