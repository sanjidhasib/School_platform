const express = require('express');
const { login, logout, getMe, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginValidator, changePasswordValidator } = require('../validators/auth.validators');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, loginValidator, login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.patch('/change-password', verifyToken, changePasswordValidator, changePassword);

module.exports = router;
