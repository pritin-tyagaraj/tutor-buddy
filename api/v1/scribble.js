'use strict';
const model = require(`./model-cloudsql`);
const winston = require('winston');

module.exports = {
    getScribbleForBatch: function(req, res, next) {
        var userId = req.user.id;
        var batchId = req.params.batchId;

        // Is the user allowed to read scribbles for this batch?
        model.batch.getBatchOwner(batchId, function(err, owner) {
            if (err) {
                winston.error('An error occurred in getBatchOwner in getScribbleForBatch', {
                    err: err
                });
                return res.json(500);
            }

            // Did we find an owner for the specified batch?
            if (!owner) {
                res.json(400, {
                    message: 'Are you sure batch ID ' + batchId + ' exists?'
                });
            }

            // Make sure the owner of the batch = current user
            if (userId !== owner) {
                winston.error('User %s is not authorized to access scribbles for batch %s', userId, batchId);
                res.json(403, {
                    message: 'You are not authorized to view scribbles for this batch'
                });
                return next();
            }

            // Validation done
            model.scribble.getScribbleForBatch(batchId, (err, result) => {
                if (err) {
                    winston.error('An error occurred in getScribbleForBatch', {
                        err: err
                    });
                }

                // Done!
                winston.info('Fetched scribble for batch', batchId);
                res.json(200, {
                    content: result
                });
            });
        });
    },

    updateScribbleForBatch: function(req, res, next) {
        var userId = req.user.id;
        var batchId = req.params.batchId;
        var scribbleContent = req.body.content;

        // Is the user allowed to read scribbles for this batch?
        model.batch.getBatchOwner(batchId, function(err, owner) {
            if (err) {
                winston.error('An error occurred in getBatchOwner in updateScribbleForBatch', {
                    err: err
                });
                return res.json(500);
            }

            // Did we find an owner for the specified batch?
            if (!owner) {
                res.json(400, {
                    message: 'Are you sure batch ID ' + batchId + ' exists?'
                });
            }

            // Make sure the owner of the batch = current user
            if (userId !== owner) {
                winston.error('User %s is not authorized to update scribbles for batch %s', userId, batchId);
                res.json(403, {
                    message: 'You are not authorized to update scribbles for this batch'
                });
                return next();
            }

            // Validation done
            model.scribble.updateScribbleForBatch(batchId, scribbleContent, (err, result) => {
                if (err) {
                    winston.error('An error occurred in updateScribbleForBatch', {
                        err: err
                    });
                }

                // Done!
                winston.info('Updated scribble for batch', batchId);
                res.json(200);
            });
        });
    }
};