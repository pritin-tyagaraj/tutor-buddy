'use strict';

var supertest = require('supertest');
var should = require('should');
var mysql = require('mysql');

// Set the process to 'test' mode
process.env.mode = 'TEST';

// Where's the app that we're testing?
var app = require('../app');
var server = supertest.agent('http://localhost:8080');

// Setup mysql tables for test
var aTestSetupQueries = [
    // Drop test tables
    'DROP TABLE IF EXISTS `users-test`',
    'DROP TABLE IF EXISTS `tutors-test`',
    'DROP TABLE IF EXISTS `tutor_batch_map-test`',

    // Create test tables
    'CREATE TABLE `users-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `first_name` varchar(255) DEFAULT NULL, `last_name` varchar(255) DEFAULT NULL, `email` varchar(255) DEFAULT NULL, `facebook_id` varchar(255) DEFAULT NULL, `facebook_token` text, `session_id` text, `tutor_profile_id` int(11) DEFAULT NULL, `student_profile_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8',
    'CREATE TABLE `tutors-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8',
    'CREATE TABLE `tutor_batch_map-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `tutor_id` int(11) DEFAULT NULL, `batch_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',

    // Add the required test data
    'INSERT INTO `users-test` (`id`, `first_name`, `last_name`, `email`, `facebook_id`, `session_id`) VALUES (\'1\', \'TestUseFirstName\', \'TestUserLastName\', \'pritin.cool@gmail.com\', \'1717376528276312\', \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxLCJleHBpcmVzSW4iOiIzMGQiLCJpYXQiOjE0ODg5MDYyMjR9.cS2oHJAuPR5Dx6GrRTOxvUJEa7NTfwJqGVn8Yes1Bz0\')'
];
var options = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'tutor-buddy',
    multipleStatements: true
};

if (process.env.DB_INSTANCE && process.env.NODE_ENV === 'production') {
    options.socketPath = `/cloudsql/${process.env.DB_INSTANCE}`;
}
var connection = mysql.createConnection(options);
connection.query(aTestSetupQueries.join(';'), (err, results) => {
    if (err) throw err;
    run();
});
connection.end();

// Start testing already!
var sTestUserJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxLCJleHBpcmVzSW4iOiIzMGQiLCJpYXQiOjE0ODg5MDYyMjR9.cS2oHJAuPR5Dx6GrRTOxvUJEa7NTfwJqGVn8Yes1Bz0';
describe('Authentication Token/Session ID', function() {
    it('Error if invalid session ID token is provided', function(done) {
        server.get('/dashboard')
            .set('Cookie', 'tutor-buddy-session=dsada')
            .expect(401)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('Redirect to authentication path if empty token is provided', function(done) {
        server.get('/dashboard')
            .set('Cookie', 'tutor-buddy-session=')
            .expect('location', '/auth/facebook/login')
            .expect(302)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('Error if expired session ID token is provided');
});

describe('Facebook authentication', function() {
    it('Authentication path redirects to Facebook login dialog');
    it('Logout path deletes client cookie');
    it('Logout path deletes server session ID');
});

describe('Static files without authentication', function() {
    it('/index.html is available', function(done) {
        server.get('/')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('/fb-access-denied.html is available', function(done) {
        server.get('/fb-access-denied.html')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('/xyz-does-not-exist.html should return 404');
});

describe('Static files with authentication', function() {
    it('/dashboard redirects to authentication path', function(done) {
        server.get('/dashboard')
            .expect('location', '/auth/facebook/login')
            .expect(302)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('/dashboard/does-not-exist (requires auth, but doesn\'t exist) redirects to authentication path');
});

describe('/tutor API', function() {
    it('POST /tutor - Creates a tutor profile for the current user', function(done) {
        server.post('/api/v1/tutor')
            .set('Cookie', 'tutor-buddy-session=' + sTestUserJWT)
            .expect(201)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('DELETE /tutor - Removes the tutor profile for the current user');

    it('POST /tutor/:tutorId/batches - Creates a new batch');
    it('GET /tutor/:tutorId/batches - Lists all batches handled by the specified tutor profile');
    it('GET /tutor/:tutorId/batches without authorization - You can only view authorized (currently, your own) tutors\' batches');
});

describe('/batch API', function() {
    it('GET /batch/:batchId - Read info about a batch')
    it('PUT /batch/:batchId - Edits a batch');
    it('DELETE /batch/:batchId - Deletes a batch');
});