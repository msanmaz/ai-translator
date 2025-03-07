import express from 'express';
import { signup, login, getCurrentUser, refreshToken } from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/refresh-token', authenticateJWT, refreshToken);


export default router;