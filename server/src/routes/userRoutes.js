import express from 'express';
import { updatePreferences, updateProfile } from '../controllers/userController.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

router.patch('/preferences', updatePreferences);
router.patch('/profile', updateProfile);

export default router;