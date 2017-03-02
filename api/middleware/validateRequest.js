"use strict";
const authWhitelist = require('../auth/whitelist.js');
const url = require('url');

module.exports = {
    checkUserAuthentication: function(req, res, next) {
        // Exclude unprotected paths
        if (authWhitelist[url.parse(req.url).pathname]) {
            next();
            return;
        }

        // Is an auth token available?
        if (!req.header('Auth-Token')) {
            console.error("No access token: " + url.parse(req.url).pathname);
            res.end("Authentication token is missing.");
        }

        next();
    },

    checkUserAuthorization: function(req, res, next) {
        next();
    }
};