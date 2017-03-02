'use strict';
const util = require('util');
const url = require('url');
const https = require('https');
const authConfig = require('./config.js');

module.exports = {
    initServerRoutes: function(server) {
        server.get('/auth/facebook/login', this.triggerUserLogin);
        server.get('/auth/facebook/redirect', this.handleLoginCodeResponse);
    },

    triggerUserLogin: function(req, res, next) {
        var loginUrl = util.format(authConfig.FACEBOOK_LOGIN_URL, authConfig.FACEBOOK_APP_ID, authConfig.FACEBOOK_REDIRECT_URL, authConfig.FACEBOOK_PERMISSIONS);
        res.redirect(loginUrl, next);
    },

    handleLoginCodeResponse: function(req, res, next) {
        // We logged in and got a code. Now we exchange it with an access_token. TODO: What if the user clicked on 'Cancel' and denied permissions?
        var params = url.parse(req.url, true).query; //
        var sGetAccessTokenUrl = util.format(authConfig.FACEBOOK_GET_TOKEN_URL, authConfig.FACEBOOK_APP_ID, authConfig.FACEBOOK_REDIRECT_URL, authConfig.FACEBOOK_APP_SECRET, params.code);
        https.get(sGetAccessTokenUrl, function(httpRes) {
            var body = '';
            httpRes.on('data', (chunk) => {
                body += chunk;
            });
            httpRes.on('end', () => {
                //We've just now finished receiving the access_token!
                var accessToken = JSON.parse(body).access_token;

                //Verify the received access_token (and also get the user's ID).
                var sInspectAccessTokenUrl = util.format(authConfig.FACEBOOK_INSPECT_TOKEN_URL, accessToken, authConfig.FACEBOOK_APP_ID + "|" + authConfig.FACEBOOK_APP_SECRET);
                https.get(sInspectAccessTokenUrl, function(httpRes) {
                    var body = '';
                    httpRes.on('data', (chunk) => {
                        body += chunk;
                    });
                    httpRes.on('end', () => {
                        // We've verified that we have a good access_token. TODO: What if it isn't good? Handle that too.
                        var userId = JSON.parse(body).data.user_id;

                        // Handle login (or) register
                        require('../v1/user').loginOrCreateUser(userId, accessToken, res, next);
                    });
                });
            })
        });
    },

    checkUserLoggedIn: function(req, res, next) {

    }
};;;