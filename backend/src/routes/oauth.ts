import express from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = express.Router();

// GitHub OAuth routes
router.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req: any, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user.id,
          userId: req.user.id, 
          email: req.user.email 
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: req.user.id, name: req.user.name, email: req.user.email }))}`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req: any, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user.id,
          userId: req.user.id, 
          email: req.user.email 
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: req.user.id, name: req.user.name, email: req.user.email }))}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  }
);

export default router;
