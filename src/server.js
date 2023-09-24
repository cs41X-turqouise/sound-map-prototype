// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();
app.disable('x-powered-by');

// Comment
const {
  PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  DEV_BASE_URL,
} = process.env;

// TODO - Integrate with MongoDB using Mongoose

/**
 * Callback Function - Not used currently
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
// const ensureAuthenticated = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/');
// };

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
  cookie: {
    maxAge: 1000 * 60 * 60 // 1 hour
  },
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// Serve static files from the public folder
app.use(express.static(__dirname + '/public'));
// Serve the db.js file
app.use('/db', express.static(path.join(__dirname, 'db')));

// Route that renders the home page
app.get('/', function (req, res) {
  res.render('index', { user: req?.user?.email });
});

app.get('/profile', function (req, res) {
  res.render('profile', { user: req.user });
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

app.get('/test', function (req, res) {
  if (!req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.send(
      `<div>`
      + `<h1>Hello ${req.user.email}</h1>`
      + `<a href="/logout">Logout</a>`
      + `<span> | </span>`
      + `<a href="/">Home</a>`
      + `</div>`
    );
  }
});

app.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect('/');
    console.log('user logged out');
  });
});

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(
  /**
   * Handle errors
   * @param {import('express').ErrorRequestHandler} err
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  function (err, req, res, next) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res
      .status(err.status || 500)
      .send(
        `<div>`
        + `<h1>Error ${res.statusCode}</h1>`
        + `<p>${err.message}</p>`
        + `<a href="/">Home</a>`
        + `</div>`
      );
  }
);

// Start the server on port
app.listen(PORT, function () {
  console.log(`server listening on port ${PORT}`);
});
