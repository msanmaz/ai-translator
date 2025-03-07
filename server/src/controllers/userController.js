import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Update user preferences
 */
export const updatePreferences = async (req, res) => {
  try {
    const { defaultSourceLanguage, defaultTargetLanguage, defaultTranslationOptions } = req.body;
    
    // Build updated preferences object
    const updatedPreferences = {};
    
    if (defaultSourceLanguage) updatedPreferences.defaultSourceLanguage = defaultSourceLanguage;
    if (defaultTargetLanguage) updatedPreferences.defaultTargetLanguage = defaultTargetLanguage;
    
    if (defaultTranslationOptions) {
      updatedPreferences.defaultTranslationOptions = {};
      
      if (defaultTranslationOptions.tone) {
        updatedPreferences.defaultTranslationOptions.tone = defaultTranslationOptions.tone;
      }
      
      if (defaultTranslationOptions.style) {
        updatedPreferences.defaultTranslationOptions.style = defaultTranslationOptions.style;
      }
      
      if (defaultTranslationOptions.preserveFormatting !== undefined) {
        updatedPreferences.defaultTranslationOptions.preserveFormatting = 
          defaultTranslationOptions.preserveFormatting;
      }
    }
    
    // Update user preferences with Prisma
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        preferences: { 
          ...req.user.preferences, 
          ...updatedPreferences 
        } 
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating user preferences'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Build updated user object
    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;
    
    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({ 
        where: { email } 
      });
      
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Update user profile with Prisma
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updatedFields
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile'
    });
  }
};