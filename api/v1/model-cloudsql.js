"use strict";

const extend = require('lodash').assign;
const mysql = require('mysql');
const winston = require('winston');

// DB table names (we use different tables for running tests)
var Table = {
    USERS: (process.env.mode === 'TEST') ? '`users-test`' : '`users`',
    TUTORS: (process.env.mode === 'TEST') ? '`tutors-test`' : '`tutors`',
    BATCHES: (process.env.mode === 'TEST') ? '`batches-test`' : '`batches`',
    TUTOR_BATCH_MAP: (process.env.mode === 'TEST') ? '`tutor_batch_map-test`' : '`tutor_batch_map`'
};

/**
 * Helper method to return a DB connection
 */
function getConnection() {
    const options = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'tutor-buddy'
    };

    if ((process.env.MODE !== 'TEST') && (process.env.MODE !== 'DEV')) {
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
        'SELECT * FROM ' + Table.USERS + ' WHERE `facebook_id` = ?', [id], (err, results) => {
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
        'UPDATE ' + Table.USERS + ' SET `session_id` = ? WHERE `id` = ?', [sessionId, userId], (err, results) => {
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
    connection.query('UPDATE ' + Table.USERS + ' SET `session_id` = NULL WHERE `id` = ?', [userId], (err) => {
        if (err) {
            return cb(err);
        }
        cb(null);
    });
    connection.end();
}

/**
 * Get the user profile of the specified user
 */
function getUserProfile(userId, cb) {
    const connection = getConnection();
    connection.query('SELECT `first_name`, `last_name`, `email`, `tutor_profile_id` FROM ' + Table.USERS + ' WHERE `id` = ?', [userId], (err, results) => {
        if (err) {
            return cb(err);
        }

        if (results.length == 0) {
            winston.error('getUserProfile returned nothing for user ID %s', userId);
            return cb({
                message: 'User profile for user ' + userId + ' not found.'
            });
        }
        cb(null, results[0]);
    });
    connection.end();
}

/**
 * Creates a new user with the provided info
 */
function createNewUser(firstName, lastName, email, facebookId, facebookAccessToken, cb) {
    const connection = getConnection();
    connection.query('INSERT INTO ' + Table.USERS + ' (`first_name`, `last_name`, `email`, `facebook_id`, `facebook_token`) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email, facebookId, facebookAccessToken], (err, results) => {
        if (err) {
            return cb(err);
        }
        cb(null, results.insertId);
    });
    connection.end();
}

/**
 * Checks if a user has an associated tutor profile
 */
function isUserTutor(userId, cb) {
    const connection = getConnection();
    connection.query('SELECT `tutor_profile_id` FROM ' + Table.USERS + ' WHERE `id` = ?', [userId], (err, result) => {
        if (err) {
            return cb(err);
        }

        // First param is null because there was no error. Second param indicates whether a matching tutor profile was found or not.
        if (result[0].tutor_profile_id) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    });
    connection.end();
}

function getTutorProfile(userId, cb) {
    const connection = getConnection();
    connection.query('SELECT t.* FROM (SELECT * FROM ' + Table.TUTORS + ') AS t INNER JOIN (SELECT * FROM ' + Table.USERS + ' WHERE id = ?) AS u WHERE t.id = u.tutor_profile_id', [userId], (err, results) => {
        if (err) {
            return cb(err);
        }

        cb(null, results[0]);
    });
}

/**
 * Creates a new tutor profile ID and maps it to the specified user.
 */
function createTutorProfile(userId, cb) {
    const connection = getConnection();
    connection.beginTransaction(function(err) {
        if (err) {
            winston.error('Error while starting transaction for createTutorProfile', {
                err: err
            });
            throw err;
        }

        // Create a new tutor profile
        connection.query('INSERT INTO ' + Table.TUTORS + ' VALUES()', (err, result) => {
            if (err) {
                console.error(err);
                connection.rollback(() => {
                    winston.error('Error while inserting into tutors for creating a new tutor profile');
                    throw err;
                });
            }

            // Map the created tutor profile with the current user
            var createdTutorProfile = result.insertId;
            connection.query('UPDATE ' + Table.USERS + ' SET `tutor_profile_id` = ? WHERE `id` = ?', [createdTutorProfile, userId], (err, result) => {
                if (err) {
                    connection.rollback(() => {
                        winston.error('Error while mapping created tutor profile ID %s to user %s', createdTutorProfile, userId);
                        throw err;
                    });
                }

                // Commit the transaction
                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            winston.error('Error while committing transaction in createTutorProfile');
                            throw err;
                        })
                    }

                    //Return the created tutor profile ID
                    connection.end();
                    cb(null, createdTutorProfile);
                })
            });
        });
    });
}

/**
 * Returns the existing batches for the provided user.
 */
function getBatchesForTutor(tutorId, cb) {
    const connection = getConnection();
    connection.query('SELECT b.* FROM (SELECT * FROM ' + Table.TUTOR_BATCH_MAP + ' WHERE tutor_id = ?) AS a INNER JOIN (SELECT * FROM ' + Table.BATCHES + ') AS b WHERE a.batch_id = b.id', [tutorId], (err, results) => {
        if (err) {
            return cb(err)
        }

        cb(null, results);
    });
    connection.end();
}

/**
 * Create a new batch for a tutor and maps it to the tutor
 */
function createBatch(tutorId, batchName, batchSubject, batchAddressText, cb) {
    const connection = getConnection();
    connection.beginTransaction(function(err) {
        if (err) {
            winston.error('Error while starting transaction for createBatch', {
                err: err
            });
            return cb(err);
        }

        // Create a new batch
        connection.query('INSERT INTO ' + Table.BATCHES + ' (`name`, `subject`, `address_text`) VALUES (?, ?, ?)', [batchName, batchSubject, batchAddressText], (err, result) => {
            if (err) return cb(err);

            // Map this batch to the tutor
            var batchId = result.insertId;
            connection.query('INSERT INTO ' + Table.TUTOR_BATCH_MAP + ' (`tutor_id`, `batch_id`) VALUES (?, ?)', [tutorId, batchId], (err) => {
                if (err) return cb(err);

                // OK done!
                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            winston.error('Error while committing transaction in createBatch');
                            throw err;
                        })
                    }

                    connection.end();
                    cb(null, batchId);
                });

            })
        });
    });
}

/**
 * Gets the tutor ID of the owner of the provided batch
 */
function getBatchOwner(batchId, cb) {
    const connection = getConnection();
    connection.query('SELECT `tutor_id` FROM ' + Table.TUTOR_BATCH_MAP + ' WHERE `batch_id` = ?', [batchId], (err, result) => {
        if (err) {
            winston.error(err);
            cb(err);
        }

        if (result.length == 0) {
            winston.info('Found no owner for batch %s', batchId);
            cb(null, "");
        } else if (result.length > 1) {
            winston.error('Found multiple owners for batch %s', batchId);
            cb(null, null);
        } else {
            var tutorId = result[0].tutor_id;
            winston.info('Found tutorId %s for batch %s', tutorId, batchId);
            cb(null, tutorId);
        }
    });
    connection.end();
}

/**
 * Deletes the provided batch. Update both the 'batches' table and the 'tutor-batch-map' table
 */
function deleteBatch(batchId, cb) {
    const connection = getConnection();
    connection.beginTransaction(function(err) {
        if (err) {
            winston.error('Error starting transaction for deleteBatch', {
                err: err
            });
            return cb(err);
        }

        //Delete the batch from the BATCHES table
        connection.query('DELETE FROM ' + Table.BATCHES + ' WHERE `id` = ?', [batchId], (err) => {
            if (err) {
                winston.error('Error deleting batch from the "batches" table', {
                    err: err
                });
                return cb(err);
            }

            //Delete the entry from the tutor-batch map
            connection.query('DELETE FROM ' + Table.TUTOR_BATCH_MAP + ' WHERE `batch_id` = ?', [batchId], (err) => {
                if (err) {
                    winston.error('Error deleting batch from tutor-batch-map', {
                        err: err
                    });
                    return cb(err);
                }

                // Commit the transaction
                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            winston.error('Error while committing transaction in deleteBatch');
                            throw err;
                        })
                    }
                    connection.end();
                    cb(null);
                });
            });
        });
    });
}

module.exports = {
    user: {
        getUserProfile: getUserProfile,
        readByFacebookId: readByFacebookId,
        createNewSession: createNewSession,
        createNewUser: createNewUser,
        terminateSession: terminateSession,
        isUserTutor: isUserTutor
    },
    tutor: {
        getTutorProfile: getTutorProfile,
        createTutorProfile: createTutorProfile
    },
    batch: {
        getBatchesForTutor: getBatchesForTutor,
        createBatch: createBatch,
        getBatchOwner: getBatchOwner,
        deleteBatch: deleteBatch
    }
};