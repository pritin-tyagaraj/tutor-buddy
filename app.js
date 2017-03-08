'use strict';

var restify = require('restify');
var plugins = require('restify-plugins');
var winston = require('winston');
var CookieParser = require('restify-cookies');

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
server.use(CookieParser.parse);

// Setup Winston
winston.addColors({
    silly: 'grey',
    debug: 'blue',
    verbose: 'cyan',
    info: 'green',
    warn: 'orange',
    error: 'red'
});
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: process.env.mode === 'TEST' ? 'none' : 'info',
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: false
});

// Wire in the auth middleware
server.use(require('./api/middleware/validateRequest').checkUserAuthentication);
winston.info('Wiring request validation middleware... Done.');

// Setup auth related routes
require('./api/auth/facebook').initServerRoutes(server);
winston.info('Setting up facebook auth routes... Done.');

// Setup 'user' routes
server.get('/user', require('./api/v1/user').getCurrentUser);
winston.info('Setting up user routes... Done.');

// Setup 'tutor' routes
server.get('/api/v1/tutor', require('./api/v1/user').getTutorProfile);
server.post('/api/v1/tutor', require('./api/v1/user').createTutorProfile);
server.put('/tutor', require('./api/v1/tutor').updateCurrentUserTutorProfile);
server.get('/tutor/:tutorId/batches', require('./api/v1/tutor').getBatchesForTutor);
server.post('/api/v1/tutor/:tutorId/batches', require('./api/v1/batch').createBatchForTutor);
winston.info('Setting up tutor routes... Done.');

// Serve the static UI resources
server.get(/^\/?.*/, restify.serveStatic({
    directory: './ui',
    default: 'index.html'
}));

// Start the server
server.listen(8080, function() {
    winston.info('%s listening at %s', server.name, server.url);
});