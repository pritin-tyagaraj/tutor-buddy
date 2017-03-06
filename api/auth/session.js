const jwt = require('jsonwebtoken');
const config = require('../../config');
const winston = require('winston');
const jwtSecret = 'fc143f1edcc846edbc6c7e2302be5602';

function getModel() {
    return require(`../v1/model-${config.get('DATA_BACKEND')}`);
}

module.exports = {
    /**
     * Respond with an HTML page with a script, that sets the session ID to local storage and then redirects to the post-login landing page
     *
     * @param  {[type]} userId    [description]
     * @param  {[type]} sessionId [description]
     * @param  {[type]} res       [description]
     * @return {[type]}           [description]
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

    createNewServerSessionForUser: function(userId, cb) {
        var sessionId = this.createNewJWTToken(userId);
        getModel().user.createNewSession(userId, sessionId, (err) => {
            if (err) {
                winston.error(err);
                cb(err);
                return;
            }
            cb(null, sessionId);
        });
    },

    terminateUserSession: function(userId, res, cb) {
        winston.info('Clearing server session for user %s', userId);
        getModel().user.terminateSession(userId, (err) => {
            if (err) {
                winston.error(err);
                cb(err);
                return;
            }

            // Server session was deleted. Now delete the client's cookie.
            winston.info('Clearing session cookie for user %s', userId);
            res.clearCookie('tutor-buddy-session', {
                path: '/',
                httpOnly: true
            });
            cb(null);
        });
    },

    createNewJWTToken: function(userId) {
        return jwt.sign({
            user: userId,
            expiresIn: '30d'
        }, jwtSecret);
    },

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