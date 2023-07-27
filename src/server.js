// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

const {
  PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  DEV_BASE_URL,
} = process.env;

passport.use(
    new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${DEV_BASE_URL}/auth/google/callback`
        },
        function (accessToken, refreshToken, profile, done) {
          const user = { googleId: profile.id, email: profile.emails[0].value };
          return done(null, user);
        }
    )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(express.json());
app.use(session({
  secret: 'thisisaverylongstringthatishopefullysecure',
  resave: false,
  saveUninitialized: false,
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')));

// Serve the db.js file
app.use('/db', express.static(path.join(__dirname, 'db')));

// Route that renders the home page
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route that starts the Google OAuth process
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
      console.log('user', req.user);
      res.redirect('/');
    }
);

// Route that renders the login page
app.get('/login', function (req, res) {
  res.send('Login Page');
});

// Start the server on port
app.listen(PORT, function () {
  console.log(`server listening on port ${PORT}`);
});
