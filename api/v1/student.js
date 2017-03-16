'use strict';
const model = require(`./model-cloudsql`);
const winston = require('winston');
const user = require('./user')

module.exports = {
    addStudentToBatch: function(req, res, next) {
        // Get the 'variables' that we need to work with
        var userId = req.user.id;
        var batchId = req.params.batchId;
        var studentFirstName = req.body.first_name;
        var studentLastName = req.body.last_name;
        var studentPhone = req.body.phone;
        var studentEmail = req.body.email;

        // Is the user allowed to add students to this batch?
        //TODO: Also do quota checks here (free account can't add more than x students etc.)
        model.batch.getBatchOwner(batchId, function(err, owner) {
            if (owner === userId) {
                winston.info('User %s is allowed to add students to batch %s. Proceeding...', userId, batchId);
                model.student.addStudentToBatch(batchId, studentFirstName, studentLastName, studentPhone, studentEmail, (err, studentId) => {
                    if (err) {
                        console.log(err);
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

    }
};