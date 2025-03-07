import prisma from '../utils/prisma.js';
import openAIService from '../services/openaiService.js';
import logger from '../utils/logger.js';

/**
 * Create a new translation
 */
export const createTranslation = async (req, res) => {
  try {
    const { sourceText, sourceLang, targetLang, options } = req.body;
    
    // Validate required fields
    if (!sourceText) {
      return res.status(400).json({
        success: false,
        message: 'Source text is required'
      });
    }
    
    // If source language is not provided, attempt to detect it
    let detectedSourceLang = sourceLang;
    if (!sourceLang) {
      try {
        detectedSourceLang = await openAIService.detectLanguage(sourceText);
        logger.info(`Detected language: ${detectedSourceLang} for user ${req.user.id}`);
      } catch (detectionError) {
        return res.status(400).json({
          success: false,
          message: 'Source language is required and could not be automatically detected'
        });
      }
    }
    
    if (!targetLang) {
      return res.status(400).json({
        success: false,
        message: 'Target language is required'
      });
    }
    
    // Initialize default options if not provided
    const translationOptions = options || {
      tone: 'standard',
      style: 'standard',
      preserveFormatting: true
    };
    
    // Get translated text from OpenAI
    let translatedText;
    try {
      translatedText = await openAIService.translateText(
        sourceText,
        detectedSourceLang,
        targetLang,
        translationOptions
      );
    } catch (translationError) {
      logger.error(`Translation error for user ${req.user.id}: ${translationError.message}`);
      return res.status(500).json({
        success: false,
        message: translationError.message || 'Translation service temporarily unavailable'
      });
    }
    
    // Create translation record with Prisma
    try {
      const translation = await prisma.translation.create({
        data: {
          userId: req.user.id,
          sourceText,
          translatedText,
          sourceLang: detectedSourceLang,
          targetLang,
          options: translationOptions,
          isFavorite: false // Default to not favorite
        }
      });
      
      res.status(201).json({
        success: true,
        data: translation
      });
    } catch (dbError) {
      logger.error(`Database error when saving translation: ${dbError.message}`);
      
      // Still return the translation even if saving fails
      res.status(200).json({
        success: true,
        data: {
          sourceText,
          translatedText,
          sourceLang: detectedSourceLang,
          targetLang,
          options: translationOptions,
          isFavorite: false,
          createdAt: new Date(),
          // Note: This is a temporary object since DB save failed
          _dbSaveFailed: true
        },
        warning: 'Translation completed but could not be saved to history'
      });
    }
  } catch (error) {
    logger.error(`Create translation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during translation'
    });
  }
};

/**
 * Get all translations for a user
 */
export const getTranslations = async (req, res) => {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Get translations for the current user using Prisma
    const translations = await prisma.translation.findMany({
      where: { 
        userId: req.user.id 
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await prisma.translation.count({
      where: { 
        userId: req.user.id 
      }
    });
    
    res.status(200).json({
      success: true,
      count: translations.length,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: translations
    });
  } catch (error) {
    logger.error(`Get translations error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving translations'
    });
  }
};

/**
 * Get favorite translations for a user
 */
export const getFavorites = async (req, res) => {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Get favorite translations for the current user using Prisma
    const favorites = await prisma.translation.findMany({
      where: { 
        userId: req.user.id,
        isFavorite: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await prisma.translation.count({
      where: { 
        userId: req.user.id,
        isFavorite: true
      }
    });
    
    res.status(200).json({
      success: true,
      count: favorites.length,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: favorites
    });
  } catch (error) {
    logger.error(`Get favorites error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving favorite translations'
    });
  }
};

/**
 * Toggle favorite status of a translation
 */
export const toggleFavorite = async (req, res) => {
  try {
    // Find translation by ID using Prisma
    const translation = await prisma.translation.findUnique({
      where: { id: req.params.id }
    });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    // Verify that the translation belongs to the current user
    if (translation.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this translation'
      });
    }
    
    // Toggle favorite status using Prisma update
    const updatedTranslation = await prisma.translation.update({
      where: { id: req.params.id },
      data: { isFavorite: !translation.isFavorite }
    });
    
    res.status(200).json({
      success: true,
      data: updatedTranslation
    });
  } catch (error) {
    logger.error(`Toggle favorite error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating translation'
    });
  }
};

/**
 * Delete a translation
 */
export const deleteTranslation = async (req, res) => {
  try {
    // Find translation by ID using Prisma
    const translation = await prisma.translation.findUnique({
      where: { id: req.params.id }
    });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    // Verify that the translation belongs to the current user
    if (translation.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this translation'
      });
    }
    
    // Delete translation using Prisma
    await prisma.translation.delete({
      where: { id: req.params.id }
    });
    
    res.status(200).json({
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete translation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting translation'
    });
  }
};