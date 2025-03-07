import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import prisma from '../utils/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

// JWT options
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

// Configure passport to use JWT Strategy
passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      // Find the user by ID from JWT payload
      const user = await prisma.user.findUnique({
        where: { id: jwtPayload.id },
        select: {
          id: true,
          email: true, 
          name: true,
          preferences: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (user) {
        return done(null, user);
      }
      
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Middleware to authenticate JWT tokens
export const authenticateJWT = passport.authenticate('jwt', { session: false });

// Middleware to ensure user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: 'Unauthorized. Please log in to access this resource.'
  });
};