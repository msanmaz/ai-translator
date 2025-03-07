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