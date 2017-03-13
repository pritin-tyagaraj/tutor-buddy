'use strict';
const model = require(`./model-cloudsql`);
const winston = require('winston');
const user = require('./user')

module.exports = {
    getBatchesForUser: function(req, res, next) {
        winston.info('Getting list of batches for user %s', req.user.id);
        var userId = req.user.id;
        model.tutor.getTutorProfile(userId, (err, dbTutorProfile) => {
            if (err) {
                winston.error("Error in getBatchesForUser", {
                    err: err
                });
                return next(err);
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
            model.batch.getBatchesForTutor(tutorId, (err, results) => {
                if (err) {
                    winston.error("Error in getBatchesForTutor", {
                        err: err
                    });
                    return next(err);
                }

                res.json(200, results);
            });
        });
    },

    createBatchForTutor: function(req, res, next) {
        // Parse the request body
        try {
            var body = JSON.parse(JSON.stringify(req.body));
        } catch (err) {
            winston.error('Error parsing request body : %s', req.body);
            res.send(400, {
                message: 'The request body does not contain valid JSON'
            });
        }
        // Get the 'variables' that we need to work with
        var tutorId = req.params.tutorId;
        var userId = req.user.id;
        var batchName = body.name;
        var batchSubject = body.subject;
        var batchAddressText = body.address_text;

        // Is the user allowed to create a batch for this tutor? Currently, the tutor profile should be mapped to the user for this to be allowed.
        model.tutor.getTutorProfile(userId, (err, dbTutorProfile) => {
            if (err) throw err;

            // Does the user have a tutor profile?
            if (!dbTutorProfile) {
                res.json(400, {
                    message: 'User doesn\'t have an associated tutor profile'
                });
                return next();
            }

            // Make sure the user is trying to create a batch for his own tutor ID
            if (dbTutorProfile.id != tutorId) {
                res.json(401, {
                    message: 'User is not authorized to create new batches for tutor ' + tutorId
                });
                return next();
            }

            // Create a new batch
            model.batch.createBatch(tutorId, batchName, batchSubject, batchAddressText, (err, batchId) => {
                if (err) throw err;

                //Done!
                winston.info('Created new batch (%s, %s, %s) for tutor %s, for user %s', batchName, batchSubject, batchAddressText, tutorId, userId);
                res.header('resource', batchId);
                res.send(201);
            });
        });
    }
};