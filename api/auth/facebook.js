'use strict';
const util = require('util');
const url = require('url');
const https = require('https');
const winston = require('winston');
const authConfig = require('./config.js');
const session = require('./session');
const user = require('../v1/user');

module.exports = {
    /**
     * Initialize restify routes required for Facebook authentication (login, logout etc.)
     * @param  {restify.Server} server The restify server instance
     */
    initServerRoutes: function(server) {
        server.get('/auth/facebook/login', this.triggerUserLogin);
        server.get('/auth/facebook/logout', session.terminateUserSession);
        server.get('/auth/facebook/redirect', this.handleLoginCodeResponse);
    },

    /**
     * Route handler for triggering a facebook login/registration
     */
    triggerUserLogin: function(req, res, next) {
        var loginUrl = util.format(authConfig.FACEBOOK_LOGIN_URL, authConfig.FACEBOOK_APP_ID, authConfig.FACEBOOK_PERMISSIONS, authConfig.FACEBOOK_REDIRECT_URL);
        winston.info('Redirecting to facebook login URL...');
        res.redirect(loginUrl, next);
    },

    /**
     * Route handler for handling the facebook response to the login request. The request either includes a code (which needs to be exchanged for a token) or an error (if the user denied access)
     */
    handleLoginCodeResponse: function(req, res, next) {
        // We logged in and got a code.
        var params = url.parse(req.url, true).query;
        var sGetAccessTokenUrl = util.format(authConfig.FACEBOOK_GET_TOKEN_URL, authConfig.FACEBOOK_APP_ID, authConfig.FACEBOOK_REDIRECT_URL, authConfig.FACEBOOK_APP_SECRET, params.code);

        // Did the user grant access? Check the response
        if (!params || params.error === 'access_denied') {
            winston.error('The user didn\'t grant access to the app via Facebook. Received parameters: ', {
                params: params
            });
            res.redirect('/fb-access-denied.html', next);
            return;
        }

        // Now we exchange it with an access_token.
        winston.info('Exchanging FB code for token...');
        https.get(sGetAccessTokenUrl, function(httpRes) {
            var body = '';
            httpRes.on('data', (chunk) => {
                body += chunk;
            });
            httpRes.on('end', () => {
                //We've just now finished receiving the access_token!
                var accessToken = JSON.parse(body).access_token;
                console.error(JSON.parse(body));

                //Verify the received access_token (and also get the user's ID).
                winston.info('Verifying received access token %s', accessToken);
                var sInspectAccessTokenUrl = util.format(authConfig.FACEBOOK_INSPECT_TOKEN_URL, accessToken, authConfig.FACEBOOK_APP_ID + "|" + authConfig.FACEBOOK_APP_SECRET);
                https.get(sInspectAccessTokenUrl, function(httpRes) {
                    var body = '';
                    httpRes.on('data', (chunk) => {
                        body += chunk;
                    });
                    httpRes.on('end', () => {
                        // We've verified that we have a good access_token.
                        var userId = JSON.parse(body).data.user_id;

                        // Did the acess token validation fail?
                        if (!userId) {
                            winston.error('Access token %s could not be verified with facebook.', accessToken);
                            return next();
                        }
                        winston.info('Access token is OK. Facebook User: %s', userId);

                        // Handle login (or) register
                        user.loginOrCreateUser(userId, accessToken, res, next);
                    });
                });
            })
        });
    }
};