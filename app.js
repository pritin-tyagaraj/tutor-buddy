'use strict';

require('@google-cloud/debug-agent').start();
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
server.get('/api/v1/user', require('./api/v1/user').getCurrentUser);
winston.info('Setting up user routes... Done.');

// Setup 'tutor' routes
server.get('/api/v1/tutor', require('./api/v1/user').getTutorProfile);
server.post('/api/v1/tutor', require('./api/v1/user').createTutorProfile);
server.put('/tutor', require('./api/v1/tutor').updateCurrentUserTutorProfile);
server.post('/api/v1/tutor/:tutorId/batches', require('./api/v1/batch').createBatchForTutor);
winston.info('Setting up tutor routes... Done.');

// Setup 'batches' routes
server.get('/api/v1/batches', require('./api/v1/batch').getBatchesForUser);
server.del('/api/v1/batch/:batchId', require('./api/v1/batch').deleteBatch);
server.get('/api/v1/batch/:batchId/students', require('./api/v1/student').getStudentsForBatch);
server.post('/api/v1/batch/:batchId/students', require('./api/v1/student').addStudentToBatch);

// Google Cloud Health Check paths
server.get('/_ah/vm_health', (req, res) => {
    res.json(200);
});

winston.info('Setting up batch routes... Done.');

// For Letsencrypt verification
server.get('/.well-known/acme-challenge/1tvWlI0MKwAojMP-hjlFXmspUY9Nv_MfMKEI-bIfvrE', function(req, res, next) {
    res.send('1tvWlI0MKwAojMP-hjlFXmspUY9Nv_MfMKEI-bIfvrE.1_e_ljwng33zNsyfnh65muyDOSIk4th_glYrG4RJXnM');
});
server.get('/.well-known/acme-challenge/rfYoOSmZYMf1_TDAyBbCvcKyOlTFftW2j6Miy1ZTMFI', function(req, res, next) {
    res.send('rfYoOSmZYMf1_TDAyBbCvcKyOlTFftW2j6Miy1ZTMFI.1_e_ljwng33zNsyfnh65muyDOSIk4th_glYrG4RJXnM');
});

// Serve the static UI resources
server.get(/^\/?.*/, restify.serveStatic({
    directory: './ui',
    default: 'index.html'
}));

// Start the server
server.listen(8080, function() {
    winston.info('%s listening at %s', server.name, server.url);
});