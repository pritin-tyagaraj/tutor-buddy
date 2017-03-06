'use strict';
const config = require('../../config');
const https = require('https');
const util = require('util');
const winston = require('winston');

function getModel() {
    return require(`./model-${config.get('DATA_BACKEND')}`);
}

/**
 * Query Facbeook to get the user's email ID, and create a new user in our database.
 */
function createNewFacebookUser(facebook_id, access_token, cb) {
    var sUrl = util.format('https://graph.facebook.com/v2.8/%s?access_token=%s&fields=first_name,last_name,email', facebook_id, access_token);
    https.get(sUrl, (httpRes) => {
        var body = '';
        httpRes.on('data', (chunk) => {
            body += chunk;
        });
        httpRes.on('end', () => {
            // Get first name, last name, email
            var httpResponse = JSON.parse(body);
            var firstName = httpResponse.first_name;
            var lastName = httpResponse.last_name;
            var email = httpResponse.email;

            // Write to DB and call cb!
            getModel().user.createNewUser(firstName, lastName, email, facebook_id, access_token, cb);
        });
    });
}

module.exports = {
    /**
     * Returns details of the currently logged in user
     */
    getCurrentUser: function(req, res, next) {
        res.end("<Your user details>");
    },

    /**
     * Log the user in (if the facebook ID provided has already been registered) or register the user (if it's a new user). In either case, a new session is created and the user is redirected to the landing page of the protected area.
     */
    loginOrCreateUser: function(facebook_id, access_token, res, next) {
        if (!facebook_id) {
            winston.error('Trying to loginOrCreate a user without an FB ID!');
        }

        winston.log('Check if FB ID %s is returning or is new user', facebook_id);
        getModel().user.readByFacebookId(facebook_id, (err, user) => {
            if (err && err.code === 404) {
                // This Facebook ID isn't present in our database. Create a new user!
                createNewFacebookUser(facebook_id, access_token, function(err, dbUserId) {
                    winston.debug('Created new account for FB user', {
                        facebook_id: facebook_id,
                        access_token: access_token
                    });

                    //Create a new session for this newly created user
                    require('../auth/session').createNewServerSessionForUser(dbUserId, (err, sessionId) => {
                        winston.debug('Created new server session for DB user', {
                            dbUserId: dbUserId,
                            sessionId: sessionId
                        });

                        // A new user and session have been created. Put the session ID in the user's browser
                        require('../auth/session').createNewClientSession(dbUserId, sessionId, res, next);
                    });
                });
            } else {
                winston.debug('Facebook user ID already exists.', {
                    facebook_id: facebook_id
                });

                // User exists already. Create a new session
                require('../auth/session').createNewServerSessionForUser(user.id, function(err, sessionId) {
                    winston.debug('New server session created for existing FB user.', {
                        facebook_id: facebook_id,
                        sessionId: sessionId
                    });

                    require('../auth/session').createNewClientSession(user.id, sessionId, res, next);
                });
            }
        });
    }
};