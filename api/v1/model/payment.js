const util = require('./util');
const winston = require('winston');

module.exports = {
    /**
     * Records a payment by a student->tutor
     */
    recordPayment: function (studentId, batchId, paymentMode, paymentAmount, paymentCurrency, paymentTime, tutorComment, cb) {
        util.executeQuery('INSERT INTO ' + util.Table.PAYMENTS + ' (`student_id`, `batch_id`, `mode`, `amount`, `currency`, `time`, `tutor_comment`) VALUES(?, ?, ?, ?, ?, ?, ?)', [studentId, batchId, paymentMode, paymentAmount,
            paymentCurrency,
            paymentTime, tutorComment
        ], cb, () => {
            cb();
        });
    },

    /**
     * Retrives the list of payments for the specified batch
     */
    getPaymentsForBatch: function (batchId, studentFilter, cb) {
        // Form the SQL query to get all data
        var sql = 'SELECT ' + util.Table.PAYMENTS + '.id, ' + util.Table.PAYMENTS + '.student_id, ' + util.Table.STUDENTS + '.first_name, ' + util.Table.STUDENTS + '.last_name, ' + util.Table.PAYMENTS + '.amount, ' + util.Table.PAYMENTS + '.currency, ' + util.Table.PAYMENTS + '.time, ' + util.Table.PAYMENTS +
            '.tutor_comment FROM ' + util.Table.PAYMENTS + ' INNER JOIN ' + util.Table.STUDENTS + ' ON ' + util.Table.PAYMENTS + '.student_id = ' + util.Table.STUDENTS + '.id WHERE ' + util.Table.PAYMENTS + '.batch_id = ?';
        var values = [batchId];

        // Apply a filter on 'student' if a filter was passed
        if(studentFilter) {
            sql += ' AND ' + util.Table.STUDENTS + '.id = ?';
            values.push(studentFilter);
        }

        util.executeQuery(sql, values, cb, (result) => {
                cb(null, result);
            });
    },

    getPaymentOwner: function (paymentId, cb) {
        util.executeQuery('SELECT ' + util.Table.TUTOR_BATCH_MAP + '.tutor_id FROM ' + util.Table.PAYMENTS + ' INNER JOIN ' + util.Table.TUTOR_BATCH_MAP + ' ON ' + util.Table.PAYMENTS + '.batch_id = ' + util.Table.TUTOR_BATCH_MAP + '.batch_id WHERE ' + util.Table.PAYMENTS +
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
    },

    deletePayment: function (paymentId, cb) {
        util.executeQuery('DELETE FROM ' + util.Table.PAYMENTS + ' WHERE id=?', [paymentId], cb, () => {
            cb();
        });
    }
};