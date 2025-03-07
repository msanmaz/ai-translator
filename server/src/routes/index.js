import express from 'express';
import authRoutes from './authRoutes.js';
import translationRoutes from './translationRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/translations', translationRoutes);
router.use('/users', userRoutes);

// API health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
  });
});

export default router;