'use strict';
const https = require('https');
const util = require('util');
const winston = require('winston');
const model = require(`./model-cloudsql`);
const userModel = require('./model/user');
const session = require('../auth/session');

/**
 * Query Facbeook to get the user's email ID, and create a new user in our database.
 */
function createNewFacebookUser(facebook_id, access_token, cb) {
    winston.info('Getting user name and email ID from FB for FB user %s', facebook_id);
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
            winston.info('Creating new user entry for FB user %s (%s %s)', facebook_id, firstName, lastName)
            userModel.createNewUser(firstName, lastName, email, facebook_id, access_token, cb);
        });
    });
}

module.exports = {
    /**
     * Returns details of the currently logged in user
     */
    getCurrentUser: function(req, res, next) {
        userModel.getUserProfile(req.user.id, (err, result) => {
            if (err) {
                throw err;
            }
            res.json(200, result);
        });
    },

    /**
     * Creates a new tutor profile and maps it to the currently logged in user
     */
    createTutorProfile: function(req, res, next) {
        // Does the user already have a tutor profile? If yes, we can't create another.
        userModel.isUserTutor(req.user.id, (err, tutorProfileExists) => {
            if (err) {
                throw err;
            }

            if (tutorProfileExists) {
                winston.error('Tutor profile already exists for user %s. Cannot create.', req.user.id);
                res.json(400, {
                    error: 'User already has a tutor profile'
                });
            } else {
                // Create a new tutor profile and map the created ID in the users table. Return the created tutor ID
                model.tutor.createTutorProfile(req.user.id, (err, tutorId) => {
                    if (err) {
                        winston.error('createTutorProfile failed');
                        return next(err);
                    }

                    // Done!
                    winston.info('Tutor profile %s created for user %s', tutorId, req.user.id);
                    res.header('resource', tutorId);
                    res.send(201);
                });
            }
        });
    },

    /**
     * Returns the tutor profile of the current user
     */
    getTutorProfile: function(req, res, next) {
        //Is the user even a tutor?
        userModel.isUserTutor(req.user.id, (err, isTutor) => {
            if (err) throw err;
            if (!isTutor) {
                winston.error('getTutorProfile called for user who isn\'t a tutor');
                res.json(404, {
                    message: 'The user doesn\'t have an associated tutor profile'
                });
            }

            //Get the tutor profile
            winston.info('User is a tutor. Fetching tutor profile...');
            model.tutor.getTutorProfile(req.user.id, (err, result) => {
                if (err) {
                    winston.error('getTutorProfile failed');
                    return next(err);
                }

                res.json(200, result);
            });
        });
    },

    /**
     * Log the user in (if the facebook ID provided has already been registered) or register the user (if it's a new user). In either case, a new session is created and the user is redirected to the landing page of the protected area.
     */
    loginOrCreateUser: function(facebook_id, access_token, res, next) {
        if (!facebook_id) {
            winston.error('Trying to loginOrCreate a user without an FB ID!');
        }

        winston.info('Check if FB ID %s is returning or is new user', facebook_id);
        userModel.readByFacebookId(facebook_id, (err, user) => {
            if (err && err.code === 404) {
                // This Facebook ID isn't present in our database. Create a new user!
                winston.info('User is a returning user. Creating new entry in user table');
                createNewFacebookUser(facebook_id, access_token, function(err, dbUserId) {
                    if (err) {
                        winston.error('An error occurred while creating a new Facebook user in the users table', {
                            error: err
                        });
                        return next(err);
                    }

                    winston.debug('Created new account for FB user', {
                        facebook_id: facebook_id,
                        access_token: access_token
                    });

                    //Create a new session for this newly created user
                    session.createNewServerSessionForUser(dbUserId, (err, sessionId) => {
                        if (err) {
                            winston.error('An error occurred while creating a new session for user ' + dbUserId, {
                                error: err
                            });
                            return next(err);
                        }

                        winston.debug('Created new server session for DB user', {
                            dbUserId: dbUserId,
                            sessionId: sessionId
                        });

                        // A new user and session have been created. Put the session ID in the user's browser
                        session.createNewClientSession(dbUserId, sessionId, res, next);
                    });
                });
            } else {
                winston.debug('Facebook user ID already exists.', {
                    facebook_id: facebook_id
                });

                // User exists already. Create a new session
                session.createNewServerSessionForUser(user.id, function(err, sessionId) {
                    if (err) {
                        winston.error('An error occurred while creating a new session for an existing user ' + user.id, {
                            error: err
                        });
                    }

                    winston.debug('New server session created for existing FB user.', {
                        facebook_id: facebook_id,
                        sessionId: sessionId
                    });

                    session.createNewClientSession(user.id, sessionId, res, next);
                });
            }
        });
    }
};