'use strict';
const model = require(`./model-cloudsql`);
const winston = require('winston');
const user = require('./user')

module.exports = {
    /**
     * Add a student to a batch
     */
    addStudentToBatch: function(req, res, next) {
        // Get the 'variables' that we need to work with
        var userId = req.user.id;
        var batchId = req.params.batchId;
        var studentFirstName = req.body.first_name;
        var studentLastName = req.body.last_name;
        var studentPhone = req.body.phone;
        var studentEmail = req.body.email;

        // Is the user allowed to add students to this batch?
        model.batch.getBatchOwner(batchId, function(err, owner) {
            if (err) {
                winston.error('An error occurred in getBatchOwner', {
                    err: err
                });
                return res.json(500);
            }

            if (owner === userId) {
                winston.info('User %s is allowed to add students to batch %s. Proceeding...', userId, batchId);
                model.student.addStudentToBatch(batchId, studentFirstName, studentLastName, studentPhone, studentEmail, (err, studentId) => {
                    if (err) {
                        winston.error('An error occurred in addStudentToBatch', {
                            err: err
                        });
                        res.json(500, {
                            message: 'An error occurred while trying to add a new student.'
                        });
                    }

                    // Done!
                    res.header('resource', studentId);
                    res.send(201);
                });
            } else {
                winston.error('User %s is not authorized to add students to batch %s', userId, batchId);
                res.json(403, {
                    message: 'You are not authorized to add students to this batch'
                });
            }
        });
    },

    /**
     * Remove a student from a batch
     */
    removeStudentFromBatch: function(req, res, next) {
        //Get the variables to work with
        var userId = req.user.id;
        var batchId = req.params.batchId;
        var studentId = req.params.studentId;

        //Is the user allowed to remove a student from a batch
        model.batch.getBatchOwner(batchId, function(err, owner) {
            if (err) {
                winston.error('An error occurred in removeStudentFromBatch', {
                    err: err
                });
                return res.json(500);
            }

            if (owner === userId) {
                winston.info('User %s is allowed to remove students from batch %s. Proceeding...', userId, batchId);
                model.student.removeStudentFromBatch(batchId, studentId, (err) => {
                    if (err) {
                        winston.error('An error occurred in removeStudentFromBatch', {
                            err: err
                        });
                        res.json(500, {
                            message: 'An error occurred while trying to remove student ' + studentId + ' from batch ' + batchId
                        });
                    }

                    //Done!
                    res.send(200);
                });
            }
        });
    },

    /**
     * Get a list of students for a batch
     */
    getStudentsForBatch: function(req, res, next) {
        //Get the variables we'll be working with
        var userId = req.user.id;
        var batchId = req.params.batchId;

        //Is the user allowed to view the list of students for this batch?
        model.batch.getBatchOwner(batchId,
            function(err, owner) {
                if (err) {
                    winston.error('An error occurred in getStudentsForBatch', {
                        err: err
                    });
                    return res.json(500);
                }

                if (owner === userId) {
                    winston.info('User %s is allowed to view the students in batch %s. Proceeding...', userId, batchId);
                    model.student.getStudentsInBatch(batchId, (err, results) => {
                        if (err) {
                            winston.error('An error occurred in getStudentsForBatch', {
                                err: err
                            });
                            res.json(500, {
                                message: 'An error occurred while trying to get a list of students within batch ' + batchId
                            });
                        }

                        // Done!
                        res.json(200, results);
                    });
                } else {
                    winston.error('User %s is not authorized to view the students in batch %s', userId, batchId);
                    res.json(403, {
                        message: 'You are not authorized to view the students in this batch'
                    });
                }
            });
    }
};