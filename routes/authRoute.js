const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//public routes
router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/validate-token', authController.validateToken);

module.exports = router;
