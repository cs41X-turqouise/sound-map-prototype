// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

// Express session setup
app.use(session({
  secret: 'thisisaverylongstringthatishopefullysecure',
  resave: false,
  saveUninitialized: true,
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.DEV_BASE_URL}/auth/google/callback`
},
function (accessToken, refreshToken, profile, done) {
  const user = { googleId: profile.id, email: profile.emails[0].value };
  return done(null, user);
}));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Route that starts the Google OAuth process
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
      res.redirect('/');
    }
);

// Route that renders the login page
app.get('/login', function (req, res) {
  res.send('Login Page');
});

// Route that renders the home page
app.get('/', function (req, res) {
  res.send('Home Page');
});

// Start the server on port 8081
app.listen(8081, function () {
  console.log(`server listening on port 8081`);
});
