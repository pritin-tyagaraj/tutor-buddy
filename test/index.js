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
    'DROP TABLE IF EXISTS `payments-test`',
    'DROP TABLE IF EXISTS `tutors-test`',
    'DROP TABLE IF EXISTS `tutor_batch_map-test`',
    'DROP TABLE IF EXISTS `batch_student_map-test`',
    'DROP TABLE IF EXISTS `batches-test`',
    'DROP TABLE IF EXISTS `students-test`',

    // Create test tables
    'CREATE TABLE `users-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `first_name` varchar(255) DEFAULT NULL, `last_name` varchar(255) DEFAULT NULL, `email` varchar(255) DEFAULT NULL, `facebook_id` varchar(255) DEFAULT NULL, `facebook_token` text, `session_id` text, `tutor_profile_id` int(11) DEFAULT NULL, `student_profile_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `tutors-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `tutor_batch_map-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `tutor_id` int(11) DEFAULT NULL, `batch_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `batch_student_map-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `batch_id` int(11) DEFAULT NULL, `student_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `batches-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) DEFAULT NULL, `subject` varchar(255) DEFAULT NULL, `address_text` text, `address_lat` float DEFAULT NULL, `address_lng` float DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `students-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `first_name` varchar(255) DEFAULT NULL, `last_name` varchar(255) DEFAULT NULL, `phone` varchar(255) DEFAULT NULL, `email` varchar(255) DEFAULT NULL, `verified` tinyint(1) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
    'CREATE TABLE `payments-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `student_id` int(11) unsigned DEFAULT NULL, `batch_id` int(11) unsigned DEFAULT NULL, `mode` varchar(255) DEFAULT NULL, `amount` decimal(13,4) DEFAULT NULL, `currency` varchar(5) DEFAULT NULL, `time` datetime DEFAULT NULL, `student_comment` text, `tutor_comment` text, `system_comment` text, PRIMARY KEY (`id`), KEY `fk_batch_id_idx` (`batch_id`), KEY `fk_student_id_idx` (`student_id`), CONSTRAINT `fk_payments-test_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `batches-test` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT `fk_payments-test_student_id` FOREIGN KEY (`student_id`) REFERENCES `students-test` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION) ENGINE=InnoDB DEFAULT CHARSET=utf8',

    // Add the required test data
    'INSERT INTO `users-test` (`id`, `first_name`, `last_name`, `email`, `facebook_id`, `session_id`, `tutor_profile_id`) VALUES (\'1\', \'TestTutorUserFirstName\', \'TestTutorUserLastName\', \'pritin.cool+tutor@gmail.com\', \'1717376528276312\', \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxLCJleHBpcmVzSW4iOiIzMGQiLCJpYXQiOjE0ODg5MDYyMjR9.cS2oHJAuPR5Dx6GrRTOxvUJEa7NTfwJqGVn8Yes1Bz0\', \'1\')',
    'INSERT INTO `users-test` (`id`, `first_name`, `last_name`, `email`, `facebook_id`, `session_id`) VALUES (\'2\', \'TestUserFirstName\', \'TestUserLastName\', \'pritin.cool@gmail.com\', \'1717376528276312\', \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\')',
    'INSERT INTO `batches-test` (`id`) VALUES (1)',
    'INSERT INTO `batches-test` (`id`) VALUES (2)', //This is to test deleteBatch
    'INSERT INTO `tutors-test` (`id`) VALUES (1)',
    'INSERT INTO `tutor_batch_map-test` (`tutor_id`, `batch_id`) VALUES (1,1)',
    'INSERT INTO `tutor_batch_map-test` (`tutor_id`, `batch_id`) VALUES (1,2)', // This is to test deleteBatch

    // Stored Procedure - deleteBatch
    `
    USE \`tutor-buddy\`;
    DROP procedure IF EXISTS \`deleteBatch-test\`;
    CREATE PROCEDURE \`deleteBatch-test\`(IN batchId INT(11) )
    BEGIN
    	DECLARE eachBatchStudent INT;
        DECLARE studentIteratorDone INT DEFAULT FALSE;

        -- Find all students that belong to the batch being deleted and belong to no other batch. Such students need to be removed from the 'students' table as well as these records are no longer referenced anywhere else.
    	DECLARE cursor_studentsNotInOtherBatches CURSOR FOR
    		SELECT a.student_id FROM
    			(SELECT student_id
    			FROM \`batch_student_map-test\`
    			GROUP BY student_id
    			HAVING (COUNT(DISTINCT batch_id) = 1)) AS a

    			INNER JOIN

    			(SELECT student_id
    			FROM \`batch_student_map-test\`
    			WHERE batch_id = batchId) AS b

    			WHERE a.student_id = b.student_id;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET studentIteratorDone = TRUE;


    	START TRANSACTION;
    		-- For each student in this batch, check if the student belongs to any other batch. If no, then delete the student from the 'students' table.
            OPEN cursor_studentsNotInOtherBatches;
            batchStudentsLoop: LOOP
    			FETCH cursor_studentsNotInOtherBatches INTO eachBatchStudent;
                IF studentIteratorDone THEN
    				LEAVE batchStudentsLoop;
    			END IF;

                DELETE FROM \`students-test\` WHERE id = eachBatchStudent;
            END LOOP;

            -- Delete all batch->student mappings for this batch
    		DELETE FROM \`batch_student_map-test\` WHERE batch_id = batchId;

            -- Delete the tutor->batch mappings for this batch
            DELETE FROM \`tutor_batch_map-test\` WHERE batch_id = batchId;

    		-- Delete the batch
            DELETE FROM \`batches-test\` WHERE id = batchId;
        COMMIT;
    END
    `,

    // Stored Procedure - addStudentToBatch
    `
    USE \`tutor-buddy\`;
    DROP procedure IF EXISTS \`addStudentToBatch-test\`;
    CREATE PROCEDURE \`addStudentToBatch-test\`(IN batchId INT(11), IN firstName VARCHAR(255), IN lastName VARCHAR(255), IN phone VARCHAR(255), IN email VARCHAR(255), OUT createdStudentId INT(11))
BEGIN
	START TRANSACTION;
    -- Create a new student entry
    INSERT INTO \`students-test\` (first_name, last_name, phone, email, verified) VALUES (firstName, lastName, phone, email, 0);
    SET createdStudentId = LAST_INSERT_ID();

    -- Create a new mapping entry to map batch and student.
    INSERT INTO \`batch_student_map-test\` (batch_id, student_id) VALUES (batchId, LAST_INSERT_ID());
    COMMIT;
END
    `
];
var options = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'tutor-buddy',
    multipleStatements: true,
    dateStrings: 'date'
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
            });
    });

    it('GET /batch/:batchId - Read info about a batch')
    it('PUT /batch/:batchId - Edits a batch');

    it('DELETE /api/v1/batch/:batchId - Deletes a batch', function(done) {
        this.timeout(5000);
        server.del('/api/v1/batch/2')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('DELETE /api/v1/batch/:batchId - Trying to delete a batch that doesn\'t exist results in an error', function(done) {
        this.timeout(5000);
        server.del('/api/v1/batch/4')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(400)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('GET /batch/:batchId/students - Lists students in a batch', function(done) {
        this.timeout(5000);
        server.get('/api/v1/batch/1/students')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('POST /api/v1/batch/:batchId/students - Adds students if the user is the owner of this batch', function(done) {
        this.timeout(5000);
        server.post('/api/v1/batch/1/students')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .send({
                first_name: "Student First Name",
                last_name: "Student Last Name"
            })
            .expect(201)
            .expect('resource', /[a-zA-Z0-9]/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('POST /api/v1/batch/:batchId/students - Error if user tries to add students to a non-existent batch', function(done) {
        this.timeout(5000);
        server.post('/api/v1/batch/43/students')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .send({
                first_name: "Student First Name",
                last_name: "Student Last Name"
            })
            .expect(403)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('DELETE /api/v1/batch/:batchId/student/:studentId - Delete an existing student in a batch', function(done) {
        this.timeout(5000);
        server.del('/api/v1/batch/1/student/1')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });
});

describe('Payment API', function(done) {
    it('POST /api/v1/batch/:batchId/student/:studentId/payments - Tutor manually records a payment for a batch', function(done) {
        this.timeout(8000);
        // Create a student first
        server.post('/api/v1/batch/1/students')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .send({
                first_name: "Student First Name",
                last_name: "Student Last Name"
            })
            .end(function(err, res) {
                if (err) throw err;
                server.post('/api/v1/batch/1/student/2/payments')
                    .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
                    .send({
                        amount: 300,
                        currency: "INR",
                        time: "9999-12-31 23:59:59",
                        tutor_comment: "Tutor Comment"
                    })
                    .expect(201)
                    .end(function(err, res) {
                        if (err) throw err;
                        done();
                    });
            });

    });

    it('POST /api/v1/batch/:batchId/student/:studentId/payments - Manually recording payment fails if the batch does not exist', function(done) {
        this.timeout(5000);
        server.post('/api/v1/batch/999/student/1/payments')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .send({
                amount: 300,
                currency: "INR",
                time: "9999-12-31 23:59:59",
                tutor_comment: "Tutor Comment"
            })
            .expect(400)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('POST /api/v1/batch/:batchId/student/:studentId/payments - Manually recording payment fails if the student does not exist', function(done) {
        this.timeout(5000);
        server.post('/api/v1/batch/1/student/900/payments')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .send({
                amount: 300,
                currency: "INR",
                time: "9999-12-31 23:59:59",
                tutor_comment: "Tutor Comment"
            })
            .expect(400)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('POST /api/v1/batch/:batchId/student/:studentId/payments - Manually recording payment fails if the batch exists but isn\'t owened by the user');
    it('POST /api/v1/batch/:batchId/student/:studentId/payments - Manually recording payment fails if the batch and student exist, but the student belongs to a different batch');

    it('GET /api/v1/batch/:batchId/payments - Get a list of payments for a batch if the user owns the batch', function(done) {
        this.timeout(5000);
        server.get('/api/v1/batch/1/payments')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('GET /api/v1/batch/batchId/payments - Error in getting list of payments if user doesn\'t own the batch');

    it('GET /api/v1/batch/batchId/payments - Error in getting list of payments if batch doesn\'t exist', function(done) {
        this.timeout(5000);
        server.get('/api/v1/batch/4/payments')
            .set('Cookie', 'tutor-buddy-session=' + sTestTutorUserJWT)
            .expect(404)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });
});