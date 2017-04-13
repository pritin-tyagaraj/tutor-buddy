"use strict";

const extend = require('lodash').assign;
const mysql = require('mysql');
const winston = require('winston');

// DB table names (we use different tables for running tests)
var Table = {
    USERS: (process.env.mode === 'TEST') ? '`users-test`' : '`users`',
    TUTORS: (process.env.mode === 'TEST') ? '`tutors-test`' : '`tutors`',
    STUDENTS: (process.env.mode === 'TEST') ? '`students-test`' : '`students`',
    BATCHES: (process.env.mode === 'TEST') ? '`batches-test`' : '`batches`',
    PAYMENTS: (process.env.mode === 'TEST') ? '`payments-test`' : '`payments`',
    TUTOR_BATCH_MAP: (process.env.mode === 'TEST') ? '`tutor_batch_map-test`' : '`tutor_batch_map`',
    BATCH_STUDENT_MAP: (process.env.mode === 'TEST') ? '`batch_student_map-test`' : '`batch_student_map`'
};

// Names of stored procedures
var StoredProcedure = {
    deleteBatch: (process.env.mode === 'TEST') ? '`deleteBatch-test`' : '`deleteBatch`',
    addStudentToBatch: (process.env.mode === 'TEST') ? '`addStudentToBatch-test`' : '`addStudentToBatch`'
};

/**
 * Helper method to return a DB connection
 */
function getConnection() {
    const options = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'tutor-buddy',
        multipleStatements: true,
        dateStrings: 'date'
    };

    if ((process.env.MODE !== 'TEST') && (process.env.MODE !== 'DEV')) {
        options.socketPath = `/cloudsql/${process.env.DB_INSTANCE}`;
    }

    return mysql.createConnection(options);
}

/**
 * Helper function to execute SQL queries and do common error handling
 */
function executeQuery(queryString, queryParams, errorCb, successCb) {
    const connection = getConnection();
    return connection.query(queryString, queryParams, (err, results) => {
        if (err) {
            winston.error('model: Error while executing query', {
                err: err
            });
            return errorCb(err);
        }
        successCb(results);
        connection.end();
    });
}

/**
 * Queries the user DB and returns the user (if found) with a matching Facebook ID or returns a 404 error (if not found)
 */
function readByFacebookId(id, cb) {
    executeQuery('SELECT * FROM ' + Table.USERS + ' WHERE `facebook_id` = ?', [id], cb, (results) => {
        if (!results.length) {
            cb({
                code: 404,
                message: 'Not found'
            });
            return;
        }
        cb(null, results[0]);
    });
}

/**
 * Creates a new session in the DB for a given user
 */
function createNewSession(userId, sessionId, cb) {
    executeQuery('UPDATE ' + Table.USERS + ' SET `session_id` = ? WHERE `id` = ?', [sessionId, userId], cb, () => {
        cb();
    });
}

/**
 * Deletes a given user's session ID from the database
 */
function terminateSession(userId, cb) {
    executeQuery('UPDATE ' + Table.USERS + ' SET `session_id` = NULL WHERE `id` = ?', [userId], cb, () => {
        cb();
    });
}

/**
 * Get the user profile of the specified user
 */
function getUserProfile(userId, cb) {
    executeQuery('SELECT `first_name`, `last_name`, `email`, `tutor_profile_id` FROM ' + Table.USERS + ' WHERE `id` = ?', [userId], cb, (results) => {
        if (results.length === 0) {
            winston.error('getUserProfile returned nothing for user ID %s', userId);
            return cb({
                message: 'model: User profile for user ' + userId + ' not found.'
            });
        }
        cb(null, results[0]);
    });
}

/**
 * Creates a new user with the provided info
 */
function createNewUser(firstName, lastName, email, facebookId, facebookAccessToken, cb) {
    executeQuery('INSERT INTO ' + Table.USERS + ' (`first_name`, `last_name`, `email`, `facebook_id`, `facebook_token`) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email, facebookId, facebookAccessToken], cb, (results) => {
        cb(null, results.insertId);
    });
}

/**
 * Checks if a user has an associated tutor profile
 */
function isUserTutor(userId, cb) {
    executeQuery('SELECT `tutor_profile_id` FROM ' + Table.USERS + ' WHERE `id` = ?', [userId], cb, (result) => {
        // First param is null because there was no error. Second param indicates whether a matching tutor profile was found or not.
        if (result[0].tutor_profile_id) {
            return cb(null, true);
        } else {
            return cb(null, false);
        }
    });
}

function getTutorProfile(userId, cb) {
    executeQuery('SELECT t.* FROM (SELECT * FROM ' + Table.TUTORS + ') AS t INNER JOIN (SELECT * FROM ' + Table.USERS + ' WHERE id = ?) AS u WHERE t.id = u.tutor_profile_id', [userId], cb, (results) => {
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
            winston.error('model: Error while starting transaction for createTutorProfile', {
                err: err
            });
            throw err;
        }

        // Create a new tutor profile
        connection.query('INSERT INTO ' + Table.TUTORS + ' VALUES()', (err, result) => {
            if (err) {
                connection.rollback(() => {
                    winston.error('model: Error while inserting into tutors for creating a new tutor profile');
                    throw err;
                });
            }

            // Map the created tutor profile with the current user
            var createdTutorProfile = result.insertId;
            connection.query('UPDATE ' + Table.USERS + ' SET `tutor_profile_id` = ? WHERE `id` = ?', [createdTutorProfile, userId], (err, result) => {
                if (err) {
                    connection.rollback(() => {
                        winston.error('model: Error while mapping created tutor profile ID %s to user %s', createdTutorProfile, userId);
                        throw err;
                    });
                }

                // Commit the transaction
                connection.commit((err) => {
                    if (err) {
                        connection.rollback(() => {
                            winston.error('model: Error while committing transaction in createTutorProfile');
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
    executeQuery('SELECT b.* FROM (SELECT * FROM ' + Table.TUTOR_BATCH_MAP + ' WHERE tutor_id = ?) AS a INNER JOIN (SELECT * FROM ' + Table.BATCHES + ') AS b WHERE a.batch_id = b.id', [tutorId], cb, (results) => {
        cb(null, results);
    });
}

/**
 * Create a new batch for a tutor and maps it to the tutor
 */
function createBatch(tutorId, batchName, batchSubject, batchAddressText, cb) {
    const connection = getConnection();
    connection.beginTransaction(function(err) {
        if (err) {
            winston.error('model: Error while starting transaction for createBatch', {
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
                            winston.error('model: Error while committing transaction in createBatch');
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
    executeQuery('SELECT `tutor_id` FROM ' + Table.TUTOR_BATCH_MAP + ' WHERE `batch_id` = ?', [batchId], cb, (result) => {
        if (result.length == 0) {
            winston.info('model: Found no owner for batch %s', batchId);
            cb(null, "");
        } else if (result.length > 1) {
            winston.error('model: Found multiple owners for batch %s', batchId);
            cb(null, null);
        } else {
            var tutorId = result[0].tutor_id;
            winston.info('model: Found tutorId %s for batch %s', tutorId, batchId);
            cb(null, tutorId);
        }
    });
}

/**
 * Deletes the provided batch. Update both the 'batches' table and the 'tutor-batch-map' table
 */
function deleteBatch(batchId, cb) {
    executeQuery('CALL `tutor-buddy`.' + StoredProcedure.deleteBatch + '(?)', [batchId], cb, () => {
        cb();
    });
}

/**
 * Checks if the given student belongs to the given batch. If yes, calls the success callback with the result as 'true'
 */
function hasStudent(batchId, studentId, cb) {
    executeQuery('SELECT COUNT(*) FROM ' + Table.BATCH_STUDENT_MAP + ' WHERE `batch_id` = ? AND `student_id` = ?', [batchId, studentId], cb, (result) => {
        var value = (result[0]['COUNT(*)'] === 0) ? false : true;
        cb(null, value);
    });
}

/**
 * Adds a student to a batch (with verified=false) and sends out an email to the student for verification. Also updates the student-batch mapping table
 */
function addStudentToBatch(batchId, firstName, lastName, phone, email, cb) {
    executeQuery('SET @createdStudentId = 0; CALL `tutor-buddy`.' + StoredProcedure.addStudentToBatch + '(?, ?, ?, ?, ?, @createdStudentId); SELECT @createdStudentId', [batchId, firstName, lastName, phone, email], cb, (result) => {
        var createdStudentId = result[2][0]['@createdStudentId']; //'2|0' because we want the first row of the result of the 3rd (zero-based) statement
        cb(null, createdStudentId);
    });
}

/**
 * Fetch a list of students belonging to the provided batch ID
 */
function getStudentsInBatch(batchId, cb) {
    executeQuery('SELECT b.* FROM (SELECT `student_id` FROM ' + Table.BATCH_STUDENT_MAP + ' WHERE `batch_id` = ?) AS a INNER JOIN (SELECT * FROM ' + Table.STUDENTS + ') AS b WHERE a.student_id = b.id', [batchId], cb, (results) => {
        cb(null, results);
    });
}

/**
 * Removes the specified student from the specified batch
 */
function removeStudentFromBatch(batchId, studentId, cb) {
    executeQuery('DELETE FROM ' + Table.BATCH_STUDENT_MAP + ' WHERE `batch_id` = ? AND `student_id` = ?', [batchId, studentId], cb, () => {
        cb();
    });
}

/**
 * Records a payment by a student->tutor
 */
function recordPayment(studentId, batchId, paymentMode, paymentAmount, paymentCurrency, paymentTime, tutorComment, cb) {
    executeQuery('INSERT INTO ' + Table.PAYMENTS + ' (`student_id`, `batch_id`, `mode`, `amount`, `currency`, `time`, `tutor_comment`) VALUES(?, ?, ?, ?, ?, ?, ?)', [studentId, batchId, paymentMode, paymentAmount,
        paymentCurrency,
        paymentTime, tutorComment
    ], cb, () => {
        cb();
    });
}

/**
 * Retrives the list of payments for the specified batch
 */
function getPaymentsForBatch(batchId, studentFilter, cb) {
    // Form the SQL query to get all data
    var sql = 'SELECT ' + Table.PAYMENTS + '.id, ' + Table.PAYMENTS + '.student_id, ' + Table.STUDENTS + '.first_name, ' + Table.STUDENTS + '.last_name, ' + Table.PAYMENTS + '.amount, ' + Table.PAYMENTS + '.currency, ' + Table.PAYMENTS + '.time, ' + Table.PAYMENTS +
        '.tutor_comment FROM ' + Table.PAYMENTS + ' INNER JOIN ' + Table.STUDENTS + ' ON ' + Table.PAYMENTS + '.student_id = ' + Table.STUDENTS + '.id WHERE ' + Table.PAYMENTS + '.batch_id = ?';
    var values = [batchId];

    // Apply a filter on 'student' if a filter was passed
    if(studentFilter) {
        sql += ' AND ' + Table.STUDENTS + '.id = ?';
        values.push(studentFilter);
    }

    executeQuery(sql, values, cb, (result) => {
            cb(null, result);
        });
}

function getPaymentOwner(paymentId, cb) {
    executeQuery('SELECT ' + Table.TUTOR_BATCH_MAP + '.tutor_id FROM ' + Table.PAYMENTS + ' INNER JOIN ' + Table.TUTOR_BATCH_MAP + ' ON ' + Table.PAYMENTS + '.batch_id = ' + Table.TUTOR_BATCH_MAP + '.batch_id WHERE ' + Table.PAYMENTS +
        '.id = ?', [paymentId], cb, (result) => {
            if (result.length == 0) {
                winston.info('model: Found no owner for payment %s', paymentId);
                cb(null, "");
            } else if (result.length > 1) {
                winston.error('model: Found multiple owners for payment %s', paymentId);
                cb(null, null);
            } else {
                var ownerId = result[0].tutor_id;
                winston.info('model: Found tutorId %s for payment %s', ownerId, paymentId);
                cb(null, ownerId);
            }
        });
}

function deletePayment(paymentId, cb) {
    executeQuery('DELETE FROM ' + Table.PAYMENTS + ' WHERE id=?', [paymentId], cb, () => {
        cb();
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
        deleteBatch: deleteBatch,
        hasStudent: hasStudent
    },
    student: {
        addStudentToBatch: addStudentToBatch,
        getStudentsInBatch: getStudentsInBatch,
        removeStudentFromBatch: removeStudentFromBatch
    },
    payment: {
        recordPayment: recordPayment,
        getPaymentsForBatch: getPaymentsForBatch,
        getPaymentOwner: getPaymentOwner,
        deletePayment: deletePayment
    }
};