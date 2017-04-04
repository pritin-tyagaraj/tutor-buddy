'use strict';
const model = require(`./model-cloudsql`);
const winston = require('winston');
const Promise = require("node-promise").Promise;
const all = require("node-promise").all;

module.exports = {
    recordPayment: function(req, res, next) {
        //Get the variables to work with
        var userId = req.user.id;
        var batchId = req.params.batchId;
        var studentId = req.params.studentId;
        var paymentMode = 'OTHER'; // Transaction was done outside of TutorBuddy (e.g cash, online transfer not initiated from the app etc.)
        var paymentAmount = req.body.amount;
        var paymentCurrency = req.body.currency;
        var paymentTime = req.body.time;
        var tutorComment = req.body.tutor_comment;

        // Is the user the owner of this batch? If not, he's not allowed to record payments for it.
        // Need to do 2x checks (in parallel) before proceeding with recording the payment.
        // 1. The batch exists and is owned by the current user
        // 2. The student exists and is part of the specified batch
        winston.info('About to record a payment for batch %s. Checking if user %s is allowed to do this...', batchId, userId);

        //Check #1
        var validateBatchOwnership = new Promise();
        model.batch.getBatchOwner(batchId, function(err, owner) {
            if (err) {
                winston.error('An error occurred in getBatchOwner', {
                    err: err
                });
                return res.json(500);
            }

            if (!owner) {
                res.json(400, 'Are you sure this batch ID ' + batchId + ' exists?');
            }

            if (userId !== owner) {
                winston.error('User %s is not authorized to record payments for batch %s', userId, batchId);
                res.json(403, {
                    message: 'You are not authorized to record payments for this batch'
                });
                return next();
            }

            // Validations for getBatchOwner done.
            validateBatchOwnership.resolve();
        });

        // Check #2
        var validateStudentMembership = new Promise();
        model.batch.hasStudent(batchId, studentId, function(err, result) {
            if (err) {
                winston.error('An error occurred in hasStudent', {
                    err: err
                });
                return res.json(500);
            }

            if (result) {
                //Validations for hasStudent done.
                validateStudentMembership.resolve();
            } else {
                winston.error('The student %s is not part of batch %s', studentId, batchId);
                res.json(400, {
                    message: 'The specified student is not part of the specified batch'
                });
            }
        });

        // Checks done.
        all(validateStudentMembership, validateBatchOwnership).then(function() {
            winston.info('User %s is allowed to record payments for batch %s', userId, batchId);
            model.payment.recordPayment(studentId, batchId, paymentMode, paymentAmount, paymentCurrency, paymentTime, tutorComment, (err) => {
                if (err) {
                    winston.error('An error occurred in recordPayment', {
                        err: err
                    });

                    // Check for foreign key violation
                    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                        return res.json(400, {
                            message: 'Invalid Batch ID or Student ID'
                        });
                    } else {
                        return res.json(500);
                    }
                }

                //Done!
                winston.info('Payment of %s %s recorded by user %s for batch %s', paymentCurrency, paymentAmount, userId, batchId);
                res.send(201);
            });
        });
    }
};