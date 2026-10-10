const express = require('express');
const { register, login, logout, getMe, changePassword, refresh, session } = require('../controllers/authController');
const { verifyToken, signUploadToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { loginValidator, changePasswordValidator, registerValidator } = require('../validators/auth.validators');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', loginLimiter, registerValidator, register);
router.post('/login', loginLimiter, loginValidator, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/session', session);
router.get('/me', verifyToken, getMe);
// A 10-minute token for sending a textbook PDF straight to this server.
router.post('/upload-token', verifyToken, requireRole('ADMIN'), (req, res) =>
  res.json({ success: true, data: { token: signUploadToken(req.user._id) } })
);
router.patch('/change-password', verifyToken, changePasswordValidator, changePassword);

module.exports = router;
