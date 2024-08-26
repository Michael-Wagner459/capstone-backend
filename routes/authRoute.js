const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//public routes
router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.login);

module.exports = router;
