"use strict";

const extend = require('lodash').assign;
const mysql = require('mysql');
const winston = require('winston');

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