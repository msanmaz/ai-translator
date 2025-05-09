// src/services/authService.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (inputPassword, hashedPassword) => {
  return bcrypt.compare(inputPassword, hashedPassword);
};

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        preferences: {
          defaultSourceLanguage: 'en',
          defaultTargetLanguage: 'es',
          defaultTranslationOptions: {
            tone: 'standard',
            style: 'standard',
            preserveFormatting: true
          }
        }
      },
    });

    // Remove password from returned object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    throw error;
  }
};

/**
 * Track login activity for a user
 * Note: This is a silent operation that won't fail the login if it errors
 * @param {string} userId - User ID
 */
export const trackLoginActivity = async (userId) => {
  try {
    // Check if your schema allows storing this data
    // If schema doesn't have lastLoginAt or loginCount fields yet, this will silently skip
    // These fields will be added to Intercom through other means
    
    // For now, we'll just store login activity in a log
    logger.info(`User login: ${userId} at ${new Date().toISOString()}`);
    
    // If you decide to extend your schema later, you can uncomment this:
    /*
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginCount: {
          increment: 1
        }
      }
    });
    */
  } catch (error) {
    // Don't throw errors - just log them
    logger.error(`Error tracking login activity: ${error.message}`);
  }
};

/**
 * Authenticate a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result with user and token
 */
export const authenticateUser = async (email, password) => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists and password is correct
    if (!user || !(await comparePasswords(password, user.password))) {
      throw new Error('Invalid email or password');
    }

    // Track login activity (silent operation)
    trackLoginActivity(user.id).catch(err => {
      logger.error(`Silent error tracking login: ${err.message}`);
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password from returned object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    logger.error(`Authentication error: ${error}`);
    throw error;
  }
};