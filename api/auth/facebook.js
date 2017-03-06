'use strict';
const util = require('util');
const url = require('url');
const https = require('https');
const winston = require('winston');
const authConfig = require('./config.js');

module.exports = {
    initServerRoutes: function(server) {
        server.get('/auth/facebook/login', this.triggerUserLogin);
        server.get('/auth/facebook/logout', this.triggerUserLogout);
        server.get('/auth/facebook/redirect', this.handleLoginCodeResponse);
    },

    triggerUserLogin: function(req, res, next) {
        var loginUrl = util.format(authConfig.FACEBOOK_LOGIN_URL, authConfig.FACEBOOK_APP_ID, authConfig.FACEBOOK_REDIRECT_URL, authConfig.FACEBOOK_PERMISSIONS);
        winston.info('Redirecting to facebook login URL...');
        res.redirect(loginUrl, next);
    },

    handleLoginCodeResponse: function(req, res, next) {
        // We logged in and got a code.
        var params = url.parse(req.url, true).query;
        var sGetAccessTokenUrl = util.format(authConfig.FACEBOOK_GET_TOKEN_URL, authConfig.FACEBOOK_APP_ID, authConfig.FACEBOOK_REDIRECT_URL, authConfig.FACEBOOK_APP_SECRET, params.code);

        // Did the user grant access? Check the response
        if (params.error && params.error === 'access_denied') {
            winston.error('The user didn\'t grant access to the app via Facebook.');
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

                //Verify the received access_token (and also get the user's ID).
                winston.info('Verifying received access token %s', accessToken);
                var sInspectAccessTokenUrl = util.format(authConfig.FACEBOOK_INSPECT_TOKEN_URL, accessToken, authConfig.FACEBOOK_APP_ID + "|" + authConfig.FACEBOOK_APP_SECRET);
                https.get(sInspectAccessTokenUrl, function(httpRes) {
                    var body = '';
                    httpRes.on('data', (chunk) => {
                        body += chunk;
                    });
                    httpRes.on('end', () => {
                        // We've verified that we have a good access_token. TODO: What if it isn't good? Handle that too.
                        var userId = JSON.parse(body).data.user_id;
                        winston.info('Access token is OK. Facebook User: %s', userId);

                        // Handle login (or) register
                        require('../v1/user').loginOrCreateUser(userId, accessToken, res, next);
                    });
                });
            })
        });
    },

    triggerUserLogout: function(req, res, next) {
        // Basic checks
        if (!req.user) {
            winston.error('Trying to log out a user, but who\'s logged in!?');
        }

        // Clear the server session
        winston.info('Triggering logout for user %s', req.user.id);
        require('../v1/user').logoutUser(req.user.id, res, function(err) {
            if (err) {
                winston.error(err);
                throw err;
            }

            winston.info('Logged out user %s', req.user.id);
            res.redirect('/', next);
        });
    }
};;;