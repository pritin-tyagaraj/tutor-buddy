const util = require('./util');
const winston = require('winston');

module.exports = {
    getTutorProfile: function (userId, cb) {
        util.executeQuery('SELECT t.* FROM (SELECT * FROM ' + util.Table.TUTORS + ') AS t INNER JOIN (SELECT * FROM ' + util.Table.USERS + ' WHERE id = ?) AS u WHERE t.id = u.tutor_profile_id', [userId], cb, (results) => {
            cb(null, results[0]);
        });
    },

    /**
     * Creates a new tutor profile ID and maps it to the specified user.
     */
    createTutorProfile: function(userId, cb) {
        const connection = util.getConnection();
        connection.beginTransaction(function(err) {
            if (err) {
                winston.error('model: Error while starting transaction for createTutorProfile', {
                    err: err
                });
                throw err;
            }

            // Create a new tutor profile
            connection.query('INSERT INTO ' + util.Table.TUTORS + ' VALUES()', (err, result) => {
                if (err) {
                    connection.rollback(() => {
                        winston.error('model: Error while inserting into tutors for creating a new tutor profile');
                        throw err;
                    });
                }

                // Map the created tutor profile with the current user
                var createdTutorProfile = result.insertId;
                connection.query('UPDATE ' + util.Table.USERS + ' SET `tutor_profile_id` = ? WHERE `id` = ?', [createdTutorProfile, userId], (err, result) => {
                    if (err) {
                        connection.rollback(() => {
                            winston.error('model: Error while mapping created tutor profile ID %s to user %s', createdTutorProfile, userId);
                            throw err;
                        });
                    }

                    // Commit the transaction
                    connection.commit((err) => {
                        if (err) {
                            connection.rollback(() => {
                                winston.error('model: Error while committing transaction in createTutorProfile');
                                throw err;
                            })
                        }

                        //Return the created tutor profile ID
                        connection.end();
                        cb(null, createdTutorProfile);
                    })
                });
            });
        });
    }
};