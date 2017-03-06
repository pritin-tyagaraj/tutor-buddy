"use strict";

const extend = require('lodash').assign;
const mysql = require('mysql');
const config = require('../../config');

/**
 * Helper method to return a DB connection
 */
function getConnection() {
    const options = {
        user: config.get('MYSQL_USER'),
        password: config.get('MYSQL_PASSWORD'),
        database: 'tutor-buddy'
    };

    if (config.get('INSTANCE_CONNECTION_NAME') && config.get('NODE_ENV') === 'production') { //&& config.get('NODE_ENV') === 'production') {
        options.socketPath = `/cloudsql/${config.get('INSTANCE_CONNECTION_NAME')}`;
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
            cb(err);
            throw err;
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
            cb(err);
            throw err;
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