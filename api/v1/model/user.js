const util = require('./util');
const winston = require('winston');

module.exports = {
    /**
     * Get the user profile of the specified user
     */
    getUserProfile: function(userId, cb) {
        util.executeQuery('SELECT `first_name`, `last_name`, `email`, `tutor_profile_id` FROM ' + util.Table.USERS + ' WHERE `id` = ?', [userId], cb, (results) => {
            if (results.length === 0) {
                winston.error('getUserProfile returned nothing for user ID %s', userId);
                return cb({
                    message: 'model: User profile for user ' + userId + ' not found.'
                });
            }
            cb(null, results[0]);
        });
    },

    /**
     * Queries the user DB and returns the user (if found) with a matching Facebook ID or returns a 404 error (if not found)
     */
    readByFacebookId: function(id, cb) {
        util.executeQuery('SELECT * FROM ' + util.Table.USERS + ' WHERE `facebook_id` = ?', [id], cb, (results) => {
            if (!results.length) {
                cb({
                    code: 404,
                    message: 'Not found'
                });
                return;
            }
            cb(null, results[0]);
        });
    },

    /**
     * Creates a new session in the DB for a given user
     */
    createNewSession: function(userId, sessionId, cb) {
        util.executeQuery('UPDATE ' + util.Table.USERS + ' SET `session_id` = ? WHERE `id` = ?', [sessionId, userId], cb, () => {
            cb();
        });
    },

    /**
     * Creates a new user with the provided info
     */
    createNewUser: function(firstName, lastName, email, facebookId, facebookAccessToken, cb) {
        util.executeQuery('INSERT INTO ' + util.Table.USERS + ' (`first_name`, `last_name`, `email`, `facebook_id`, `facebook_token`) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email, facebookId, facebookAccessToken], cb, (results) => {
            cb(null, results.insertId);
        });
    },

    /**
     * Deletes a given user's session ID from the database
     */
    terminateSession: function(userId, cb) {
        util.executeQuery('UPDATE ' + util.Table.USERS + ' SET `session_id` = NULL WHERE `id` = ?', [userId], cb, () => {
            cb();
        });
    },

    /**
     * Checks if a user has an associated tutor profile
     */
    isUserTutor: function(userId, cb) {
        util.executeQuery('SELECT `tutor_profile_id` FROM ' + util.Table.USERS + ' WHERE `id` = ?', [userId], cb, (result) => {
            // First param is null because there was no error. Second param indicates whether a matching tutor profile was found or not.
            if (result[0].tutor_profile_id) {
                return cb(null, true);
            } else {
                return cb(null, false);
            }
        });
    }
};