"use strict";

const extend = require('lodash').assign;
const mysql = require('mysql');

/**
 * Helper method to return a DB connection
 */
function getConnection() {
    const options = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'tutor-buddy'
    };

    if (process.env.DB_INSTANCE && process.env.NODE_ENV === 'production') {
        options.socketPath = `/cloudsql/${process.env.DB_INSTANCE}`;
    }

    return mysql.createConnection(options);
}

/**
 * Queries the user DB and returns the user (if found) with a matching Facebook ID or returns a 404 error (if not found)
 */
function readByFacebookId(id, cb) {
    const connection = getConnection();
    connection.query(
        'SELECT * FROM `users` WHERE `facebook_id` = ?', id, (err, results) => {
            if (err) {
                cb(err);
                return;
            }
            if (!results.length) {
                cb({
                    code: 404,
                    message: 'Not found'
                });
                return;
            }
            cb(null, results[0]);
        });
    connection.end();
}

/**
 * Creates a new session in the DB for a given user
 */
function createNewSession(userId, sessionId, cb) {
    const connection = getConnection();
    connection.query(
        'UPDATE `users` SET `session_id` = ? WHERE `id` = ?', [sessionId, userId], (err, results) => {
            if (err) {
                cb(err);
                return;
            }
            cb();
        });
    connection.end();
}

/**
 * Deletes a given user's session ID from the database
 */
function terminateSession(userId, cb) {
    const connection = getConnection();
    connection.query('UPDATE `users` SET `session_id` = NULL WHERE `id` = ?', [userId], (err) => {
        if (err) {
            return cb(err);

        }
        cb(null);
    });
}

/**
 * Creates a new user with the provided info
 */
function createNewUser(firstName, lastName, email, facebookId, facebookAccessToken, cb) {
    const connection = getConnection();
    connection.query('INSERT INTO `users` (`first_name`, `last_name`, `email`, `facebook_id`, `facebook_token`) VALUES (?, ?, ?, ?, ?);', [firstName, lastName, email, facebookId, facebookAccessToken], (err, results) => {
        if (err) {
            return cb(err);
        }
        cb(null, results.insertId);
    });
}

module.exports = {
    user: {
        readByFacebookId: readByFacebookId,
        createNewSession: createNewSession,
        createNewUser: createNewUser,
        terminateSession: terminateSession
    }
};