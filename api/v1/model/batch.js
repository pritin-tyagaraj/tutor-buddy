const util = require('./util');
const winston = require('winston');

module.exports = {
    /**
     * Returns the existing batches for the provided user.
     */
    getBatchesForTutor: function (tutorId, cb) {
        util.executeQuery('SELECT b.* FROM (SELECT * FROM ' + util.Table.TUTOR_BATCH_MAP + ' WHERE tutor_id = ?) AS a INNER JOIN (SELECT * FROM ' + util.Table.BATCHES + ') AS b WHERE a.batch_id = b.id', [tutorId], cb, (results) => {
            cb(null, results);
        });
    },

    /**
     * Create a new batch for a tutor and maps it to the tutor
     */
    createBatch: function(tutorId, batchName, batchSubject, batchAddressText, batchRecurrenceDays, batchRecurrenceStart, batchRecurrenceEnd, batchStartTime, batchEndTime, cb) {
        const connection = util.getConnection();
        connection.beginTransaction(function(err) {
            if (err) {
                winston.error('model: Error while starting transaction for createBatch', {
                    err: err
                });
                return cb(err);
            }

            // Create a new batch
            connection.query('INSERT INTO ' + util.Table.BATCHES + ' (`name`, `subject`, `address_text`, `recur_days`, `recur_start`, `recur_end`, `start_time`, `end_time`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [batchName, batchSubject, batchAddressText, batchRecurrenceDays, batchRecurrenceStart, batchRecurrenceEnd, batchStartTime, batchEndTime], (err, result) => {
                if (err) return cb(err);

                // Map this batch to the tutor
                var batchId = result.insertId;
                connection.query('INSERT INTO ' + util.Table.TUTOR_BATCH_MAP + ' (`tutor_id`, `batch_id`) VALUES (?, ?)', [tutorId, batchId], (err) => {
                    if (err) return cb(err);

                    // Create an empty entry in the scribbles table
                    connection.query('INSERT INTO ' + util.Table.SCRIBBLES + ' (`batch_id`) VALUES (?)', [batchId], (err) => {
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
                    });
                });
            });
        });
    },

    /**
     * Gets the tutor ID of the owner of the provided batch
     */
    getBatchOwner: function(batchId, cb) {
        util.executeQuery('SELECT `tutor_id` FROM ' + util.Table.TUTOR_BATCH_MAP + ' WHERE `batch_id` = ?', [batchId], cb, (result) => {
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
    },

    /**
     * Deletes the provided batch. Update both the 'batches' table and the 'tutor-batch-map' table
     */
    deleteBatch: function(batchId, cb) {
        util.executeQuery('CALL `tutor-buddy`.' + util.StoredProcedure.deleteBatch + '(?)', [batchId], cb, () => {
            cb();
        });
    },

    /**
     * Checks if the given student belongs to the given batch. If yes, calls the success callback with the result as 'true'
     */
    hasStudent: function(batchId, studentId, cb) {
        util.executeQuery('SELECT COUNT(*) FROM ' + util.Table.BATCH_STUDENT_MAP + ' WHERE `batch_id` = ? AND `student_id` = ?', [batchId, studentId], cb, (result) => {
            var value = (result[0]['COUNT(*)'] === 0) ? false : true;
            cb(null, value);
        });
    }
};