// src/services/intercomService.js
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

// Environment variables for Intercom
const INTERCOM_SECRET_KEY = process.env.INTERCOM_SECRET_KEY;
const INTERCOM_APP_ID = process.env.INTERCOM_APP_ID;

/**
 * Generates an HMAC for Intercom identity verification
 * @param {string} userId - The user's ID
 * @returns {string|null} The generated HMAC hash or null if secret key is missing
 */
export const generateIntercomUserHash = (userId) => {
  if (!INTERCOM_SECRET_KEY) {
    logger.warn('INTERCOM_SECRET_KEY not set - secure mode disabled');
    return null;
  }

  try {
    // Create HMAC using SHA256
    const hmac = crypto
      .createHmac('sha256', INTERCOM_SECRET_KEY)
      .update(userId.toString())
      .digest('hex');
    
    return hmac;
  } catch (error) {
    logger.error(`Error generating Intercom user hash: ${error.message}`);
    return null;
  }
};

/**
 * Calculate days between now and a given date
 * @param {Date|string} date - The date to compare
 * @returns {number} Number of days
 */
const getDaysSinceDate = (date) => {
  const startDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Prepare user data for Intercom
 * @param {Object} user - User object from database
 * @returns {Promise<Object>} Formatted user data for Intercom
 */
export const prepareIntercomData = async (user) => {
  if (!user) return null;
  
  try {
    // Generate HMAC for secure identification
    const userHash = generateIntercomUserHash(user.id);
    
    // Get user translation stats
    const stats = await getUserTranslationStats(user.id);
    
    return {
      // Basic Intercom identification
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt instanceof Date 
        ? Math.floor(user.createdAt.getTime() / 1000)
        : Math.floor(new Date(user.createdAt).getTime() / 1000),
      appId: INTERCOM_APP_ID,
      
      // Secure mode hash
      userHash,
      
      // Custom attributes for tracking
      custom_attributes: {
        // User preferences
        default_source_language: user.preferences?.defaultSourceLanguage || 'en',
        default_target_language: user.preferences?.defaultTargetLanguage || 'es',
        translation_tone: user.preferences?.defaultTranslationOptions?.tone || 'standard',
        
        // Usage metrics
        total_translations: stats.totalTranslations,
        total_characters_translated: stats.totalCharactersTranslated,
        most_used_source_language: stats.mostUsedSourceLang,
        most_used_target_language: stats.mostUsedTargetLang,
        favorite_translations_count: stats.favoritesCount,
        days_since_signup: getDaysSinceDate(user.createdAt),
        last_translation_at: stats.lastTranslationDate 
          ? new Date(stats.lastTranslationDate).toISOString() 
          : null,
      }
    };
  } catch (error) {
    logger.error(`Error preparing Intercom data: ${error.message}`);
    
    // Return basic data if detailed data fails
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      appId: INTERCOM_APP_ID,
      userHash: generateIntercomUserHash(user.id)
    };
  }
};

/**
 * Get translation statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Translation statistics
 */
async function getUserTranslationStats(userId) {
  try {
    // Count total translations
    const totalTranslations = await prisma.translation.count({
      where: { userId }
    });
    
    // Count favorite translations
    const favoritesCount = await prisma.translation.count({
      where: { 
        userId,
        isFavorite: true
      }
    });
    
    // Get most used source language
    const sourceLangStats = await prisma.translation.groupBy({
      by: ['sourceLang'],
      where: { userId },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 1
    });
    
    // Get most used target language
    const targetLangStats = await prisma.translation.groupBy({
      by: ['targetLang'],
      where: { userId },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 1
    });
    
    // Get the most recent translation date
    const mostRecentTranslation = await prisma.translation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    // Estimate characters translated (since we don't have a characterCount field)
    // We'll use the source text length as an approximation
    const randomSample = await prisma.translation.findMany({
      where: { userId },
      select: { sourceText: true },
      take: 20, // Sample up to 20 translations
    });
    
    // Calculate average characters per translation
    const avgCharsPerTranslation = randomSample.length > 0
      ? randomSample.reduce((sum, t) => sum + t.sourceText.length, 0) / randomSample.length
      : 0;
    
    // Estimate total characters translated
    const totalCharactersTranslated = Math.round(avgCharsPerTranslation * totalTranslations);
    
    return {
      totalTranslations,
      favoritesCount,
      mostUsedSourceLang: sourceLangStats[0]?.sourceLang || 'unknown',
      mostUsedTargetLang: targetLangStats[0]?.targetLang || 'unknown',
      lastTranslationDate: mostRecentTranslation?.createdAt || null,
      totalCharactersTranslated
    };
  } catch (error) {
    logger.error(`Error getting user translation stats: ${error.message}`);
    return {
      totalTranslations: 0,
      favoritesCount: 0,
      mostUsedSourceLang: 'unknown',
      mostUsedTargetLang: 'unknown',
      lastTranslationDate: null,
      totalCharactersTranslated: 0
    };
  }
}