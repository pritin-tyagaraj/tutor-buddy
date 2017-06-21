'use strict';
const tutorModel = require('./model/tutor');
const batchModel = require('./model/batch');
const winston = require('winston');
const user = require('./user')

module.exports = {
    getBatchesForUser: function(req, res, next) {
        winston.info('Getting list of batches for user %s', req.user.id);
        var userId = req.user.id;
        tutorModel.getTutorProfile(userId, (err, dbTutorProfile) => {
            if (err) {
                winston.error("Error in getBatchesForUser", {
                    err: err
                });
                return res.json(500);
            }

            // Does the user have a tutor profile?
            if (!dbTutorProfile) {
                res.json(400, {
                    message: 'User doesn\'t have an associated tutor profile'
                });
                return next();
            }

            var tutorId = dbTutorProfile.id;
            winston.info('User\'s tutor profile ID is %s', tutorId);
            winston.info('Getting list of batches for tutor %s', tutorId);
            batchModel.getBatchesForTutor(tutorId, (err, results) => {
                if (err) {
                    winston.error("Error in getBatchesForTutor", {
                        err: err
                    });
                    return res.json(500);
                }

                res.json(200, results);
            });
        });
    },

    createBatchForTutor: function(req, res, next) {
        // Get the 'variables' that we need to work with
        var tutorId = req.params.tutorId;
        var userId = req.user.id;
        var batchName = req.body.name;
        var batchSubject = req.body.subject;
        var batchAddressText = req.body.address_text;
        var batchRecurrenceDays = req.body.recur_days.join(''); // Convert [1, 2, 5] to "125" for storing in a single column
        var batchRecurrenceStart = req.body.recur_start;
        var batchRecurrenceEnd = req.body.recur_end;
        var batchStartTime = req.body.start_time + "00"; //Time of day for beginning of class
        var batchEndTime = req.body.end_time + "00"; //Time of day for end of class. "00" added due to the way MySQL will interpret this (See https://dev.mysql.com/doc/refman/5.5/en/time.html)

        // Is the user allowed to create a batch for this tutor? Currently, the tutor profile should be mapped to the user for this to be allowed.
        winston.info('Fetching tutor profile for user %s', req.user.id);
        tutorModel.getTutorProfile(userId, (err, dbTutorProfile) => {
            if (err) {
                return res.json(500);
            }

            // Does the user have a tutor profile?
            winston.info('Checking if user %s has an associated tutor profile', req.user.id);
            if (!dbTutorProfile) {
                res.json(400, {
                    message: 'User doesn\'t have an associated tutor profile'
                });
                return next();
            }

            // Make sure the user is trying to create a batch for his own tutor ID
            winston.info('Checking if user trying to create a batch for his own tutor ID %s', dbTutorProfile.id);
            if (dbTutorProfile.id !== parseInt(tutorId, 10)) {
                res.json(401, {
                    message: 'User is not authorized to create new batches for tutor ' + tutorId
                });
                return next();
            }

            // Create a new batch
            winston.info('Trigger creation of new batch for user %s, tutor ID %s', req.user.id, dbTutorProfile.id);
            batchModel.createBatch(tutorId, batchName, batchSubject, batchAddressText, batchRecurrenceDays, batchRecurrenceStart, batchRecurrenceEnd, batchStartTime, batchEndTime, (err, batchId) => {
                if (err) {
                    return res.json(500);
                }

                //Done!
                winston.info('Created new batch (%s, %s, %s) for tutor %s, for user %s', batchName, batchSubject, batchAddressText, tutorId, userId);
                res.header('resource', batchId);
                res.json(201);
            });
        });
    },

    /**
     * Delete a batch belonging to the user
     */
    deleteBatch: function(req, res, next) {
        //Get the variables we're working with
        var userId = req.user.id;
        var batchId = req.params.batchId;
        var sMessage;

        winston.info('deleteBatch: Getting tutor profile for user %s', userId);
        tutorModel.getTutorProfile(userId, (err, dbTutorProfile) => {
            if (err) {
                return res.json(500);
            }

            // Does the user have a tutor profile?
            if (!dbTutorProfile) {
                return res.json(400, {
                    message: 'User doesn\'t have an associated tutor profile'
                });
            }

            // Make sure the batch we're trying to delete belongs to this tutor
            winston.info('deleteBatch: Got %s. Trying to get batch owner for %s', dbTutorProfile.id, batchId);
            batchModel.getBatchOwner(batchId, (err, dbBatchOwner) => {
                if (err) {
                    return res.json(500);
                }

                // Does this batch exist?
                winston.info('Making sure this batch %s has an owner', batchId);
                if (!dbBatchOwner) {
                    sMessage = 'Batch ' + batchId + ' doesn\'t exist in the tutor-batch mapping table. Can\'t delete!';
                    winston.error(sMessage);
                    return res.json(400, {
                        message: sMessage
                    });
                }

                // The user's tutor profile and the batch's owner are the same? If yes, go ahead and delete!
                winston.info('Making sure the tutor is the owner of the batch before deleting');
                if (dbBatchOwner !== dbTutorProfile.id) {
                    sMessage = 'Can\'t delete batch.' + batchId + '. It doesn\'t belong to the user!';
                    winston.error(sMessage);
                    return res.json(400, {
                        message: sMessage
                    });
                }

                winston.info('Done with all validations. Deleting batch %s', batchId);
                batchModel.deleteBatch(batchId, (err) => {
                    if (err) {
                        return res.json(500);
                    }

                    //Done!
                    winston.info('Deleted batch %s for tutor $s, user %s', batchId, dbTutorProfile.id, userId);
                    res.json(200);
                });
            });
        });
    }
};