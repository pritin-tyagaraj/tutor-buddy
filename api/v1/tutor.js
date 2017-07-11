'use strict';

module.exports = {
    getCurrentUserTutorProfile: function(req, res, next) {

    },

    updateCurrentUserTutorProfile: function(req, res, next) {

    },

    createBatchForUser: function(req, res, next) {

    },

    getBatchesForTutor: function(req, res, next) {

    },

    createBatchForTutor: function(req, res, next) {
        // Get info from the URL path
        var tutorId = req.params.tutorId;

        // Get info from the request payload
        winston.error(req.params);
    }
};


// 'use strict';
// const express = require('express');
// const bodyParser = require('body-parser');
// const config = require('../../config');
//
// function getModel() {
//     return require(`./model-${config.get('DATA_BACKEND')}`);
// }
//
// const router = express.Router();
//
// // Automatically parse request body as JSON
// router.use(bodyParser.json());
//
// /**
//  * GET /api/tutors
//  *
//  * Retrieve a page of books (up to ten at a time).
//  */
// router.get('/', (req, res, next) => {
//     getModel().list(10, req.query.pageToken, (err, entities, cursor) => {
//         if (err) {
//             next(err);
//             return;
//         }
//         res.json({
//             items: entities,
//             nextPageToken: cursor
//         });
//     });
// });
//
// /**
//  * GET /api/tutors/:id
//  *
//  * Retrieve a book.
//  */
// router.get('/:tutorId', (req, res, next) => {
//     getModel().read(req.params.tutorId, (err, entity) => {
//         if (err) {
//             next(err);
//             return;
//         }
//         res.json(entity);
//     });
// });
//
// module.exports = router;