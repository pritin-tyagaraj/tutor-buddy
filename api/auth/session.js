const jwt = require('jsonwebtoken');
const winston = require('winston');
const model = require(`../v1/model-cloudsql`);
const userModel = require('../v1/model/user');

module.exports = {
    jwtSecret: 'fc143f1edcc846edbc6c7e2302be5602',

    /**
     * Instructs the browser to set a session cookie, and redirects to the post-login landing page.
     */
    createNewClientSession: function(userId, sessionId, res, next) {
        res.setCookie('tutor-buddy-session', sessionId, {
            path: '/',
            httpOnly: true
        });
        winston.info('Created response cookie with session ID for user.', {
            userId: userId,
            sessionId: sessionId
        });

        res.redirect('/dashboard', next);
    },

    /**
     * Creates a new session for the user in the DB and returns the created session ID
     */
    createNewServerSessionForUser: function(userId, cb) {
        var sessionId = jwt.sign({
            user: userId,
            expiresIn: '30d'
        }, this.jwtSecret);

        userModel.createNewSession(userId, sessionId, (err) => {
            if (err) {
                winston.error(err);
                cb(err);
                return;
            }
            cb(null, sessionId);
        });
    },

    /**
     * Destroys the current user's session (clears the session ID for that user in the DB and also instructs the browser to clear the session cookie). Then redirects to the unprotected welcome page.
     */
    terminateUserSession: function(req, res, next) {
        // Basic checks
        if (!req.user) {
            winston.error('Trying to log out a user, but who\'s logged in!?');
            return next();
        }

        // Clear the server session
        winston.info('Triggering logout for user %s', req.user.id);
        userModel.terminateSession(req.user.id, (err) => {
            if (err) {
                winston.error(err);
                throw err;
            }

            // Server session was deleted. Now delete the client's cookie.
            winston.info('Clearing session cookie for user %s', req.user.id);
            res.clearCookie('tutor-buddy-session', {
                path: '/',
                httpOnly: true
            });
            winston.info('Logged out user %s', req.user.id);
            res.redirect('/', next);
        });
    },

    /**
     * Parses a given JWT token (the session ID received during every request) and returns the parsed JSON object
     */
    parseJWTToken: function(sToken) {
        try {
            var decoded = jwt.verify(sToken, this.jwtSecret);
        } catch (err) {
            winston.error('Error parsing JWT: %s | %s', err.name, err.message);
            throw err;
        }

        return decoded;
    }
};