import { createUser, authenticateUser, generateToken } from '../services/authService.js';
import { prepareIntercomData } from '../services/intercomService.js';
import logger from '../utils/logger.js';

/**
 * User signup controller
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }
    
    const user = await createUser({ name, email, password });
    const token = generateToken(user.id);
    
    // Prepare Intercom data
    const intercom = await prepareIntercomData(user);
    
    res.status(201).json({
      success: true,
      token,
      user,
      intercom // Include Intercom data
    });
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    
    // Handle duplicate email error
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user account'
    });
  }
};

/**
 * User login controller
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const { user, token } = await authenticateUser(email, password);
    
    // Prepare Intercom data
    const intercom = await prepareIntercomData(user);
    
    res.status(200).json({
      success: true,
      token,
      user,
      intercom // Include Intercom data
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    
    // Use 400 Bad Request for invalid credentials instead of 401
    // This avoids confusion with token-based authentication failures
    if (error.message === 'Invalid email or password') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

/**
 * Get current user controller
 */
export const getCurrentUser = async (req, res) => {
  try {
    // Prepare Intercom data
    const intercom = await prepareIntercomData(req.user);
    
    res.status(200).json({
      success: true,
      user: req.user,
      intercom // Include Intercom data
    });
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user data'
    });
  }
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req, res) => {
  try {
    // The user is already available from the authenticateJWT middleware
    const userId = req.user.id;
    
    // Generate a fresh token
    const token = generateToken(userId);
    
    // Prepare Intercom data
    const intercom = await prepareIntercomData(req.user);
    
    res.status(200).json({
      success: true,
      token,
      user: req.user,
      intercom // Include Intercom data
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};