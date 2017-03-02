'use strict';
const config = require('../../config');
const https = require('https');
const util = require('util');

function getModel() {
    return require(`./model-${config.get('DATA_BACKEND')}`);
}

/**
 * Query Facbeook to get the user's email ID, and create a new user in our database.
 * @param  {String}   facebook_id  The facebook ID
 * @param  {String}   access_token The facebook access token
 * @param  {Function} cb           Callback function to indicate that a new user has been created in the database
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
    getCurrentUser: function(req, res, next) {
        res.end("<Your user details>");
    },

    getUserByFacebookID: function(user_id, cb) {

    },

    loginOrCreateUser: function(facebook_id, access_token, res, next) {
        getModel().user.readByFacebookId(facebook_id, (err, user, cursor) => {
            if (err.code === 404) {
                // This Facebook ID isn't present in our database. Create a new user!
                createNewFacebookUser(facebook_id, access_token, function(dbUserId) {
                    //Create a new session for this newly created user
                    require('../auth/session').createNewServerSessionForUser(dbUserId, (sessionId) => {
                        // A new user and session have been created. Put the session ID in the user's browser
                        require('../auth/session').createNewClientSession(dbUserId, sessionId, res);
                    });
                });
            } else {
                // User exists already. Create a new session
                require('../auth/session').createNewServerSessionForUser(user.id, function(sessionId) {
                    require('../auth/session').createNewClientSession(user.id, sessionId, res);
                });
            }
        });
    }
};