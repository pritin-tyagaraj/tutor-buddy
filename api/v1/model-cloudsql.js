"use strict";

const extend = require('lodash').assign;
const mysql = require('mysql');
const config = require('../../config');

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

// [START list]
// function list(limit, token, cb) {
//     token = token ? parseInt(token, 10) : 0;
//     const connection = getConnection();
//     connection.query(
//         'SELECT * FROM `tutors` LIMIT ? OFFSET ?', [limit, token],
//         (err, results) => {
//             if (err) {
//                 cb(err);
//                 return;
//             }
//             const hasMore = results.length === limit ? token + results.length : false;
//             cb(null, results, hasMore);
//         }
//     );
//     connection.end();
// }
//
// function read(id, cb) {
//     const connection = getConnection();
//     connection.query(
//         'SELECT * FROM `tutors` WHERE `id` = ?', id, (err, results) => {
//             if (err) {
//                 cb(err);
//                 return;
//             }
//             if (!results.length) {
//                 cb({
//                     code: 404,
//                     message: 'Not found'
//                 });
//                 return;
//             }
//             cb(null, results[0]);
//         });
//     connection.end();
// }

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

// [END list]
//
module.exports = {
    user: {
        readByFacebookId: readByFacebookId,
        createNewSession: createNewSession,
        createNewUser: createNewUser,
        terminateSession: terminateSession
    }
};