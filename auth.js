var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
    function(username, password, done) {
        if (username === 'admin' && password === 'password') {
            return done(null, { id: 1, username: 'admin' });
        }
        return done(null, false);
    }
));

exports.isAuthenticated = passport.authenticate('basic', { session: false });
