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
    'DROP TABLE IF EXISTS `batches-test`',

    // Create test tables
    'CREATE TABLE `users-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `first_name` varchar(255) DEFAULT NULL, `last_name` varchar(255) DEFAULT NULL, `email` varchar(255) DEFAULT NULL, `facebook_id` varchar(255) DEFAULT NULL, `facebook_token` text, `session_id` text, `tutor_profile_id` int(11) DEFAULT NULL, `student_profile_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `tutors-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `tutor_batch_map-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `tutor_id` int(11) DEFAULT NULL, `batch_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `batches-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) DEFAULT NULL, `subject` varchar(255) DEFAULT NULL, `address_text` text, `address_lat` float DEFAULT NULL, `address_lng` float DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',

    // Add the required test data
    'INSERT INTO `users-test` (`id`, `first_name`, `last_name`, `email`, `facebook_id`, `session_id`, `tutor_profile_id`) VALUES (\'1\', \'TestTutorUserFirstName\', \'TestTutorUserLastName\', \'pritin.cool+tutor@gmail.com\', \'1717376528276312\', \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxLCJleHBpcmVzSW4iOiIzMGQiLCJpYXQiOjE0ODg5MDYyMjR9.cS2oHJAuPR5Dx6GrRTOxvUJEa7NTfwJqGVn8Yes1Bz0\', \'1\')',
    'INSERT INTO `users-test` (`id`, `first_name`, `last_name`, `email`, `facebook_id`, `session_id`) VALUES (\'2\', \'TestUserFirstName\', \'TestUserLastName\', \'pritin.cool@gmail.com\', \'1717376528276312\', \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\')',
    'INSERT INTO `batches-test` (`id`) VALUES (1)',
    'INSERT INTO `tutors-test` (`id`) VALUES (1)',
    'INSERT INTO `tutor_batch_map-test` (`tutor_id`, `batch_id`) VALUES (1,1)'
];
var options = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'tutor-buddy',
    multipleStatements: true
};

if ((process.env.MODE !== 'TEST') && (process.env.MODE !== DEV)) {
    options.socketPath = `/cloudsql/${process.env.DB_INSTANCE}`;
}
var connection = mysql.createConnection(options);
connection.query(aTestSetupQueries.join(';'), (err, results) => {
    if (err) throw err;
    run();
});
connection.end();

// Start testing already!
var sTestTutorUserJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxLCJleHBpcmVzSW4iOiIzMGQiLCJpYXQiOjE0ODg5MDYyMjR9.cS2oHJAuPR5Dx6GrRTOxvUJEa7NTfwJqGVn8Yes1Bz0';
var sTestUserJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoyLCJleHBpcmVzSW4iOiIzMGQiLCJpYXQiOjE0ODkxMzM4Mjh9.--iM2pEcceT-pOhvSulNEwFEDnPYC2JLpcn-LZTI7gY';
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

describe('/user API', function() {
    it('GET /api/v1/user - Returns the profile of the current user', function(done) {
        this.timeout(5000);
        server.get('/api/v1/user')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });
});

describe('/tutor API', function() {
    it('GET /api/v1/tutor - Returns 404 if no tutor profile is available for current user', function(done) {
        this.timeout(5000);
        server.get('/api/v1/tutor')
            .set('Cookie', 'tutor-buddy-session=' + sTestUserJWT)
            .expect(404)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('POST /api/v1/tutor - Creates a tutor profile for the current user', function(done) {
        this.timeout(5000);
        server.post('/api/v1/tutor')
            .set('Cookie', 'tutor-buddy-session=' + sTestUserJWT)
            .expect(201)
            .expect('resource', /[a-zA-Z0-9]/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('GET /api/v1/tutor - Get the existing tutor profile for the current user', function(done) {
        this.timeout(5000);
        server.get('/api/v1/tutor')
            .set('Cookie', 'tutor-buddy-session=' + sTestUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('DELETE /tutor - Removes the tutor profile for the current user');

    it('POST /api/v1/tutor/:tutorId/batches - Creates a new batch', function(done) {
        this.timeout(5000);
        server.post('/api/v1/tutor/1/batches')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .send({
                name: "BatchName",
                address_text: "BatchAddress",
                subject: "BatchSubject"
            })
            .expect(201)
            .expect('resource', /[a-zA-Z0-9]/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });


    it('GET /tutor/:tutorId/batches - Lists all batches handled by the specified tutor profile');
    it('GET /tutor/:tutorId/batches without authorization - You can only view authorized (currently, your own) tutors\' batches');
});

describe('/batch API', function() {
    it('GET /api/v1/batches - Returns all batches of the current user', function(done) {
        this.timeout(5000);
        server.get('/api/v1/batches')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('GET /batch/:batchId - Read info about a batch')
    it('PUT /batch/:batchId - Edits a batch');
    it('DELETE /batch/:batchId - Deletes a batch');
    it('GET /batch/:batchId/students - Lists students in a batch');
});