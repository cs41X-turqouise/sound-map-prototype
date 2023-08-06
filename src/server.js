// server.js
require('dotenv').config();
// main services
const express = require('express');
const mongoose = require('mongoose');
// middleware
/**
 * Protect app from some well-known web vulnerabilities by setting HTTP headers appropriately.
 * @see {@link https://helmetjs.github.io/}
 */
const helmet = require('helmet');
const createError = require('http-errors');
const session = require('express-session');
const passport = require('passport');
// const path = require('path');
const logger = require('morgan');
// const cors = require('cors');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Media = require('./models/media.js');
require('./services/googleStrategy.js');

/** @typedef {import('mongodb').GridFSBucket} GridFSBucket */

const {
  PORT,
  ATLAS_USERNAME,
  ATLAS_PASSWORD,
  ATLAS_DB,
} = process.env;
const ATLAS_URI = `mongodb+srv://${ATLAS_USERNAME}:${ATLAS_PASSWORD}@${ATLAS_DB}?retryWrites=true&w=majority`;

// Create a new GridFS storage engine
const storage = new GridFsStorage({
  url: ATLAS_URI,
  file: (req, file) => {
    console.log('file', file);
    console.log('req.user', req.user);
    return {
      filename: file.originalname,
      metadata: {
        // owner: req.user._id
      }
    };
  }
});
// Create a new multer instance with the GridFS storage engine
const upload = multer({ storage });
// Create express instance
const app = express();
/**
 * Info about the web server.
 * Removed because it could be used in simple attacks
 */
app.disable('x-powered-by');
app.use(helmet({
  // contentSecurityPolicy: {
  //   directives: {
  //     defaultSrc: ['\'self\''],
  //     scriptSrc: [
  //       '\'self\'',
  //       'http://cdn.leafletjs.com',
  //       'https://unpkg.com',
  //       'https://cdn.jsdelivr.net'
  //     ],
  //   },
  // },
  // FIX THIS
  contentSecurityPolicy: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: 'sid',
  secret: 'thisisaverylongstringthatishopefullysecure',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 // 1 hour
  },
}));

/** @type {Grid.Grid} */
let gfs;
/** @type {GridFSBucket} */
let gridfsBucket;
mongoose.connection.once('open', () => {
  // Init stream
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });
  gfs = new Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads');
  console.log('MongoDB database connection established successfully');
});

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));

// Serve static files from the public folder
app.use(express.static(__dirname + '/public'));

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Route that renders the home page
app.get('/', function (req, res) {
  res.render('index', { user: req?.user?.google.email });
});

app.get('/profile', function (req, res) {
  res.render('profile', { user: req.user });
});

// Route that starts the Google OAuth process
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function (req, res) {
    console.log('user', req.user);
    res.redirect('/');
  }
);

app.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect('/');
    console.log('user logged out');
  });
});

app.post('/api/upload',
  upload.single('file'),
  function (req, res) {
    Media.findOne({ filename: req.file.filename })
      .then((media) => {
        console.log('media', media);
        if (media) {
          return res.status(400).json({ file: 'File already exists' });
        }
        const newMedia = new Media({
          owner: req.user?._id || 1,
          fileId: req.file.id,
          filename: req.file.filename,
        });
        newMedia.save()
          .then((media) => {
            console.log('media', media);
            res.json(media);
          })
          .catch((err) => {
            console.log('err', err);
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        console.log('err', err);
        res.status(400).json(err);
      });
  }
);

// Route that retrieves a file from GridFS
app.get('/api/file/:filename', (req, res) => {
  Media.findOne({ filename: req.params.filename })
    .then((media) => {
      if (!media) {
        return res.status(404).send();
      }
      console.log('media', media);
      gfs.files
        .findOne({ filename: media.filename })
        .then((file) => {
          console.log('file', file);
          if (!file) {
            return res.status(404).send();
          }
          // const readstream = gridfsBucket.openDownloadStream({
          //   // filename: media.filename,
          //   _id: media.fileId,
          // });
          const readstream = gridfsBucket.openDownloadStream(file._id);
          res.set('Content-Type', media.contentType);
          readstream.pipe(res);
        })
        .catch((err) => {
          res.status(404).send();
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send();
    });
});

app.get('/api/files', (req, res) => {
  gfs.files.toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }
    res.status(200).json({
      success: true,
      files
    });
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
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
    res.status(err.status || 500);
    res.render('error', { error: err });
  }
);

mongoose
  .connect(ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');

    // Start the server on port
    app.listen(PORT, function () {
      console.log(`server listening on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
