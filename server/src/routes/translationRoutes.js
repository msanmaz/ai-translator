import express from 'express';
import { 
  createTranslation, 
  getTranslations, 
  getFavorites, 
  toggleFavorite, 
  deleteTranslation 
} from '../controllers/translationController.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

router.post('/', createTranslation);
router.get('/', getTranslations);
router.get('/favorites', getFavorites);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteTranslation);

export default router;