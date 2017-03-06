"use strict";
const authWhitelist = require('../auth/whitelist.js');
const winston = require('winston');
const url = require('url');

module.exports = {
    checkUserAuthentication: function(req, res, next) {
        // Exclude unprotected paths
        winston.info('Authenticating request for %s', url.parse(req.url).pathname);
        if (authWhitelist[url.parse(req.url).pathname]) {
            winston.info('Route is whitelisted. Auth: OK', url.parse(req.url).pathname);
            next();
            return;
        }

        // Is an auth token available?
        winston.info('Route %s not whitelisted', url.parse(req.url).pathname);
        if (!req.cookies['tutor-buddy-session']) {
            winston.info('Received request %s without session token. Redirecting to login page.', url.parse(req.url).pathname);
            res.redirect('/auth/facebook/login', next);
            return;
        }

        // Is the auth token available
        winston.info('Route request includes session token. Validating token...');
        var sToken = req.cookies['tutor-buddy-session'];
        var decodedToken;
        try {
            decodedToken = require('../auth/session').parseJWTToken(sToken);
        } catch (err) {
            // If the token has expired, trigger a login again.
            if (err.name === 'TokenExpiredError') {
                winston.info('Expired JWT was provided. Redirecting to login page.');
                res.redirect('/auth/facebook/login', next);
            } else {
                // If a malformed JWT is provided, perhaps it was tampered? End with a HTTP 401
                res.send(401, 'Could not validate provided session ID');
                winston.error('Terminating response, malformed JWT was provided');
            }
            return;
        }

        //Token is valid
        winston.info('Session token is ok. (DB User: %s) Auth: OK', decodedToken.user);
        req.user = {
            id: decodedToken.user
        };
        next();
    },

    checkUserAuthorization: function(req, res, next) {
        next();
    }
};