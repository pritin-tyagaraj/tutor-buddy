const util = require('./util');
const winston = require('winston');

module.exports = {
    /**
     * Adds a student to a batch (with verified=false) and sends out an email to the student for verification. Also updates the student-batch mapping table
     */
    addStudentToBatch: function (batchId, firstName, lastName, phone, email, cb) {
        util.executeQuery('SET @createdStudentId = 0; CALL `tutor-buddy`.' + util.StoredProcedure.addStudentToBatch + '(?, ?, ?, ?, ?, @createdStudentId); SELECT @createdStudentId', [batchId, firstName, lastName, phone, email], cb, (result) => {
            var createdStudentId = result[2][0]['@createdStudentId']; //'2|0' because we want the first row of the result of the 3rd (zero-based) statement
            cb(null, createdStudentId);
        });
    },

    /**
     * Fetch a list of students belonging to the provided batch ID
     */
    getStudentsInBatch: function (batchId, cb) {
        util.executeQuery('SELECT b.* FROM (SELECT `student_id` FROM ' + util.Table.BATCH_STUDENT_MAP + ' WHERE `batch_id` = ?) AS a INNER JOIN (SELECT * FROM ' + util.Table.STUDENTS + ') AS b WHERE a.student_id = b.id', [batchId], cb, (results) => {
            cb(null, results);
        });
    },

    /**
     * Removes the specified student from the specified batch
     */
    removeStudentFromBatch: function (batchId, studentId, cb) {
        util.executeQuery('DELETE FROM ' + util.Table.BATCH_STUDENT_MAP + ' WHERE `batch_id` = ? AND `student_id` = ?', [batchId, studentId], cb, () => {
            cb();
        });
    }
};