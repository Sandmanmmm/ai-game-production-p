import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';
import { config } from './index';

const prisma = new PrismaClient();

// JWT Strategy (for existing auth)
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
}, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

// GitHub Strategy
if (config.githubClientId && config.githubClientSecret) {
  passport.use(new GitHubStrategy({
    clientID: config.githubClientId,
    clientSecret: config.githubClientSecret,
    callbackURL: "/api/auth/github/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // First check if user exists with GitHub ID
      let user = await prisma.user.findUnique({
        where: { githubId: profile.id }
      });

      if (user) {
        // User exists with GitHub ID, return user
        return done(null, user);
      }

      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          // Link GitHub to existing account
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              githubId: profile.id,
              provider: {
                set: [...new Set([...existingUser.provider, 'github'])]
              },
              avatar: profile.photos?.[0]?.value || existingUser.avatar,
              name: existingUser.name || profile.displayName || profile.username
            }
          });
          return done(null, user);
        }
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          githubId: profile.id,
          email: email || `github_${profile.id}@gameforge.local`,
          name: profile.displayName || profile.username || 'GitHub User',
          avatar: profile.photos?.[0]?.value,
          provider: ['github']
        }
      });

      return done(null, user);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Google Strategy
if (config.googleClientId && config.googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // First check if user exists with Google ID
      let user = await prisma.user.findUnique({
        where: { googleId: profile.id }
      });

      if (user) {
        // User exists with Google ID, return user
        return done(null, user);
      }

      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          // Link Google to existing account
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: profile.id,
              provider: {
                set: [...new Set([...existingUser.provider, 'google'])]
              },
              avatar: profile.photos?.[0]?.value || existingUser.avatar,
              name: existingUser.name || profile.displayName
            }
          });
          return done(null, user);
        }
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: email || `google_${profile.id}@gameforge.local`,
          name: profile.displayName || 'Google User',
          avatar: profile.photos?.[0]?.value,
          provider: ['google']
        }
      });

      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Serialize/Deserialize user for sessions (optional, mainly for OAuth)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
