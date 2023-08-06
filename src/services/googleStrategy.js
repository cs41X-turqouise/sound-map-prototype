const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.js');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  DEV_BASE_URL,
} = process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${DEV_BASE_URL}/auth/google/callback`,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      // const user = { googleId: profile.id, email: profile.emails[0].value };
      try {
        const existingUser = await User.findOne({ 'google.id': profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }
        const newUser = new User({
          method: 'google',
          google: {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value
          }
        });
        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        done(err, false);
      }
    }
  )
);
