'use strict';

var restify = require('restify');
var plugins = require('restify-plugins');

// Set up the server
const server = restify.createServer({
    name: 'tutor-buddy',
    version: '1.0.0',
    formatters: {
        'text/html': function(req, res, body, cb) {
            if (body instanceof Error)
                return body.stack;

            if (Buffer.isBuffer(body))
                return cb(null, body.toString('base64'));

            return cb(null, body);
        }
    }
});
server.use(plugins.acceptParser(server.acceptable));
server.use(plugins.queryParser());
server.use(plugins.bodyParser());

// Wire in the auth middleware
server.use([require('./api/middleware/validateRequest').checkUserAuthentication, require('./api/middleware/validateRequest').checkUserAuthorization]);

// Setup auth related routes
require('./api/auth/facebook').initServerRoutes(server);

// Setup 'user' routes
server.get('/user', require('./api/v1/user').getCurrentUser);

// Setup 'tutor' routes
server.get('/tutor', require('./api/v1/tutor').getCurrentUserTutorProfile);
server.put('/tutor', require('./api/v1/tutor').updateCurrentUserTutorProfile);
server.get('/tutor/:tutorId/batches', require('./api/v1/tutor').getBatchesForTutor);
server.post('/tutor/:tutorId/batches', require('./api/v1/tutor').createBatchForTutor);

// Start the server
server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});