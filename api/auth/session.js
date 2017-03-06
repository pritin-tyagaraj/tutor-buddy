const jwt = require('jsonwebtoken');
const config = require('../../config');
const winston = require('winston');
const jwtSecret = 'fc143f1edcc846edbc6c7e2302be5602';

function getModel() {
    return require(`../v1/model-${config.get('DATA_BACKEND')}`);
}

function createNewJWTToken(userId) {
    return jwt.sign({
        user: userId,
        expiresIn: '30d'
    }, jwtSecret);
}

module.exports = {
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
        var sessionId = createNewJWTToken(userId);
        getModel().user.createNewSession(userId, sessionId, (err) => {
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
        }

        // Clear the server session
        winston.info('Triggering logout for user %s', req.user.id);
        getModel().user.terminateSession(req.user.id, (err) => {
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
            var decoded = jwt.verify(sToken, jwtSecret);
        } catch (err) {
            winston.error('Error parsing JWT: %s | %s', err.name, err.message);
            throw err;
        }

        return decoded;
    },
};