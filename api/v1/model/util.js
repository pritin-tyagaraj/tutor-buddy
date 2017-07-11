const mysql = require('mysql');
const winston = require('winston');

// Connection options
var connectionOptions = {
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: 'tutor-buddy',
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT,
    multipleStatements: true,
    dateStrings: 'date'
};

module.exports = {
    // DB table names (we use different tables for running tests)
    Table: {
        USERS: (process.env.mode === 'TEST') ? '`users-test`' : '`users`',
        TUTORS: (process.env.mode === 'TEST') ? '`tutors-test`' : '`tutors`',
        STUDENTS: (process.env.mode === 'TEST') ? '`students-test`' : '`students`',
        BATCHES: (process.env.mode === 'TEST') ? '`batches-test`' : '`batches`',
        PAYMENTS: (process.env.mode === 'TEST') ? '`payments-test`' : '`payments`',
        SCRIBBLES: (process.env.mode === 'TEST') ? '`scribbles-test`' : '`scribbles`',
        TUTOR_BATCH_MAP: (process.env.mode === 'TEST') ? '`tutor_batch_map-test`' : '`tutor_batch_map`',
        BATCH_STUDENT_MAP: (process.env.mode === 'TEST') ? '`batch_student_map-test`' : '`batch_student_map`'
    },

    // Names of stored procedures
    StoredProcedure: {
        deleteBatch: (process.env.mode === 'TEST') ? '`deleteBatch-test`' : '`deleteBatch`',
        addStudentToBatch: (process.env.mode === 'TEST') ? '`addStudentToBatch-test`' : '`addStudentToBatch`'
    },

    getConnection: function() {
        return mysql.createConnection(connectionOptions);
    },

    /**
     * Helper function to execute SQL queries and do common error handling
     */
    executeQuery: function(queryString, queryParams, errorCb, successCb) {
        const connection = this.getConnection();
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
};