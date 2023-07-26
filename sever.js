const fastify = require('fastify')({
    logger: true
});

// Import Passport and the Google OAuth strategy
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Import crypto module for hashing
const crypto = require('crypto');

// Passport setup
passport.use(new GoogleStrategy({
    //todo
    //get Google Client ID and Google Client Secret ID
    clientID: process.env.GOOGLE_CLIENT_ID, // Environment Variable  set client ID to GoogleClientID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Environment Variable client set to GoogleClientSecret
    callbackURL: "http://localhost:3000/auth/google/callback" // Replace with own callback URL
},
function(accessToken, refreshToken, profile, done) {
    // todo
    // When a user logs in, find or create the user in the database
    // Check DOB, age >= 13
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        // Get the user's email and hash it
        const email = profile.emails[0].value;
        const hashedEmail = crypto.createHash('sha256').update(email).digest('hex');
        
        //todo
        //save this hashed email in database
        user.hashedEmail = hashedEmail;
        
        return done(err, user);
    });
}));

// Route that starts the Google OAuth process
fastify.get('/auth/google',
    // todo
    // Get DOB
    passport.authenticate('google', { scope: ['profile', 'email'] }) // email  
);

// Route that Google redirects to after the user logs in
fastify.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // After successful authentication, redirect to  homepage
        res.redirect('/');
    }
);

// Set up  server to start listening on port 8000
fastify.listen(8000, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})
