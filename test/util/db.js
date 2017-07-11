var mysql = require('mysql');

// Get a DB connection for tests
function getConnection() {
    var options = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'tutor-buddy',
        multipleStatements: true,
        dateStrings: 'date'
    };
    return mysql.createConnection(options);
}

module.exports = {
    refreshDatabase: function() {
        // Setup mysql tables for test
        var aTestSetupQueries = [
            // Drop test tables
            'DROP TABLE IF EXISTS `users-test`',
            'DROP TABLE IF EXISTS `payments-test`',
            'DROP TABLE IF EXISTS `scribbles-test`',
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
            'CREATE TABLE `batches-test` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `name` varchar(255) DEFAULT NULL, `subject` varchar(255) DEFAULT NULL, `address_text` text, `address_lat` float DEFAULT NULL, `address_lng` float DEFAULT NULL, `recur_days` varchar(7) DEFAULT NULL, `recur_start` date DEFAULT NULL, `recur_end` date DEFAULT NULL, `start_time` time DEFAULT NULL, `end_time` time DEFAULT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
            'CREATE TABLE `students-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `first_name` varchar(255) DEFAULT NULL, `last_name` varchar(255) DEFAULT NULL, `phone` varchar(255) DEFAULT NULL, `email` varchar(255) DEFAULT NULL, `verified` tinyint(1) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8',
            'CREATE TABLE `payments-test` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `student_id` int(11) unsigned DEFAULT NULL, `batch_id` int(11) unsigned DEFAULT NULL, `mode` varchar(255) DEFAULT NULL, `amount` decimal(13,4) DEFAULT NULL, `currency` varchar(5) DEFAULT NULL, `time` datetime DEFAULT NULL, `student_comment` text, `tutor_comment` text, `system_comment` text, PRIMARY KEY (`id`), KEY `fk_batch_id_idx` (`batch_id`), KEY `fk_student_id_idx` (`student_id`), CONSTRAINT `fk_payments-test_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `batches-test` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT `fk_payments-test_student_id` FOREIGN KEY (`student_id`) REFERENCES `students-test` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION) ENGINE=InnoDB DEFAULT CHARSET=utf8',
            'CREATE TABLE `scribbles-test` (`id` int(11) NOT NULL AUTO_INCREMENT, `batch_id` int(11) unsigned DEFAULT NULL, `content` text, PRIMARY KEY (`id`), KEY `fk_batchId_idx` (`batch_id`), CONSTRAINT `fk_batchId_test` FOREIGN KEY (`batch_id`) REFERENCES `batches-test` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8',

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
                    -- Delete all batch->student mappings for this batch
                    DELETE FROM \`batch_student_map-test\` WHERE batch_id = batchId;

                    -- Delete the tutor->batch mappings for this batch
                    DELETE FROM \`tutor_batch_map-test\` WHERE batch_id = batchId;

                    -- Delete payments
                    DELETE FROM \`payments-test\` WHERE batch_id = batchId;

                    -- Delete scribbles
                    DELETE FROM \`scribbles-test\` WHERE batch_id = batchId;

                    -- Delete the batch
                    DELETE FROM \`batches-test\` WHERE id = batchId;

            		-- For each student in this batch, check if the student belongs to any other batch. If no, then delete the student from the 'students' table.
                    OPEN cursor_studentsNotInOtherBatches;
                    batchStudentsLoop: LOOP
            			FETCH cursor_studentsNotInOtherBatches INTO eachBatchStudent;
                        IF studentIteratorDone THEN
            				LEAVE batchStudentsLoop;
            			END IF;

                        DELETE FROM \`students-test\` WHERE id = eachBatchStudent;
                    END LOOP;
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

        // Execute setup scripts
        var connection = getConnection();
        connection.query(aTestSetupQueries.join(';'), (err, results) => {
            if (err) throw err;
            run();
        });
        connection.end();
    };
};