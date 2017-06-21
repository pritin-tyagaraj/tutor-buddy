const batch = require('../../../api/v1/batch');
const batchModel = require('../../../api/v1/model/batch');
const tutorModel = require('../../../api/v1/model/tutor');
const sinon = require('sinon');
const should = require('should');

describe('=== Batch API ===', function() {
    describe('List batches of a tutor', function() {
        var GET_TUTOR_PROFILE_ERROR_SCENARIO = 'GET_TUTOR_PROFILE_ERROR_SCENARIO';
        var TUTOR_PROFILE_NOT_FOUND_SCENARIO = 'TUTOR_PROFILE_NOT_FOUND_SCENARIO';
        var GET_BATCHES_DB_ERROR_SCENARIO = 'GET_BATCHES_DB_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            }
        };

        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(tutorModel, 'getTutorProfile').callsFake(function(userId, callback) {
                if(scenario === GET_TUTOR_PROFILE_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === TUTOR_PROFILE_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else {
                    callback(null, {
                        id: 'TutorId'
                    });
                }
            });

            sinon.stub(batchModel, 'getBatchesForTutor').callsFake(function(tutorId, callback) {
                if(scenario === GET_BATCHES_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null, []);
                }
            });

            response.json = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            tutorModel.getTutorProfile.restore();
            batchModel.getBatchesForTutor.restore();
        });

        it('Return HTTP 500 if there is an error in fetching the user\'s tutor profile', function() {
            scenario = GET_TUTOR_PROFILE_ERROR_SCENARIO;
            batch.getBatchesForUser(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 400 if the user doesn\'t have a tutor profile', function() {
            scenario = TUTOR_PROFILE_NOT_FOUND_SCENARIO;
            batch.getBatchesForUser(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 500 if there is a DB error while listing the tutor\'s batches', function() {
            scenario = GET_BATCHES_DB_ERROR_SCENARIO;
            batch.getBatchesForUser(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 200 if batches are listed successfully', function() {
            scenario = 'OK';
            batch.getBatchesForUser(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });

    describe('Create a new batch for a tutor', function() {
        var GET_TUTOR_PROFILE_ERROR_SCENARIO = 'GET_TUTOR_PROFILE_ERROR_SCENARIO';
        var TUTOR_PROFILE_NOT_FOUND_SCENARIO = 'TUTOR_PROFILE_NOT_FOUND_SCENARIO';
        var TUTOR_CREATES_BATCH_FOR_OTHER_USER_SCENARIO = 'TUTOR_CREATES_BATCH_FOR_OTHER_USER_SCENARIO';
        var CREATE_BATCH_DB_ERROR_SCENARIO = 'CREATE_BATCH_DB_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            body: {
                recur_days: [1, 2, 5]
            },
            params: {
                tutorId: '123'
            }
        };

        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(tutorModel, 'getTutorProfile').callsFake(function(userId, callback) {
                if (scenario === GET_TUTOR_PROFILE_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === TUTOR_PROFILE_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else if (scenario === TUTOR_CREATES_BATCH_FOR_OTHER_USER_SCENARIO) {
                    callback(null, {
                        id: 999
                    });
                } else {
                    callback(null, {
                        id: 123
                    });
                }
            });

            sinon.stub(batchModel, 'createBatch').callsFake(function(tutorId, batchName, batchSubject, batchAddressText, batchRecurrenceDays, batchRecurrenceStart, batchRecurrenceEnd, batchStartTime, batchEndTime, callback) {
                if(scenario === CREATE_BATCH_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null, 'CreatedBatchId');
                }
            });

            response.json = sinon.spy();
            response.header = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            tutorModel.getTutorProfile.restore();
            batchModel.createBatch.restore();
        });

        it('Return HTTP 500 if there is an error in fetching the user\'s tutor profile', function() {
            scenario = GET_TUTOR_PROFILE_ERROR_SCENARIO;
            batch.createBatchForTutor(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 400 if the user doesn\'t have a tutor profile', function() {
            scenario = TUTOR_PROFILE_NOT_FOUND_SCENARIO;
            batch.createBatchForTutor(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 401 if the user is trying to create a batch for another user', function() {
            scenario = TUTOR_CREATES_BATCH_FOR_OTHER_USER_SCENARIO;
            batch.createBatchForTutor(request, response, next);
            response.json.getCall(0).args[0].should.equal(401);
        });

        it('Return HTTP 500 if there is a DB error while creating the new batch', function() {
            scenario = CREATE_BATCH_DB_ERROR_SCENARIO;
            batch.createBatchForTutor(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 201 + Set response header if creation is successful', function() {
            scenario = 'OK';
            batch.createBatchForTutor(request, response, next);
            response.json.getCall(0).args[0].should.equal(201);
            response.header.getCall(0).args[0].should.equal('resource');
            response.header.getCall(0).args[1].should.equal('CreatedBatchId');
        });
    });

    describe('Delete a batch', function() {
        var GET_TUTOR_PROFILE_ERROR_SCENARIO = 'GET_TUTOR_PROFILE_ERROR_SCENARIO';
        var TUTOR_PROFILE_NOT_FOUND_SCENARIO = 'TUTOR_PROFILE_NOT_FOUND_SCENARIO';
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var BATCH_DOES_NOT_EXIST_SCENARIO = 'BATCH_DOES_NOT_EXIST_SCENARIO';
        var USER_DOES_NOT_OWN_BATCH_SCENARIO = 'USER_DOES_NOT_OWN_BATCH_SCENARIO';
        var DELETE_BATCH_DB_ERROR_SCENARIO = 'DELETE_BATCH_DB_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            params: {}
        }
        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(tutorModel, 'getTutorProfile').callsFake(function(userId, callback) {
                if (scenario === GET_TUTOR_PROFILE_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === TUTOR_PROFILE_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else {
                    callback(null, {
                        id: 123
                    });
                }
            });

            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                if (scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === BATCH_DOES_NOT_EXIST_SCENARIO) {
                    callback(null, null);
                } else if (scenario === USER_DOES_NOT_OWN_BATCH_SCENARIO) {
                    callback(null, 999);
                } else {
                    callback(null, 123);
                }
            });

            sinon.stub(batchModel, 'deleteBatch').callsFake(function(batchId, callback) {
                if(scenario === DELETE_BATCH_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null);
                }
            });

            response.json = sinon.spy();
        });

        afterEach(function() {
            tutorModel.getTutorProfile.restore();
            batchModel.getBatchOwner.restore();
            batchModel.deleteBatch.restore();
        });

        it('Return HTTP 500 if there is an error while fetching the user\'s tutor profile', function() {
            scenario = GET_TUTOR_PROFILE_ERROR_SCENARIO;
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 400 if the user doesn\'t have a tutor profile', function() {
            scenario = TUTOR_PROFILE_NOT_FOUND_SCENARIO;
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 500 if there is an error in getting the batch\'s owner ID', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 400 if the batch doesn\'t exist', function() {
            scenario = BATCH_DOES_NOT_EXIST_SCENARIO;
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 400 if the batch doesn\'t belong to the user', function() {
            scenario = USER_DOES_NOT_OWN_BATCH_SCENARIO;
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 500 if there is a DB error while deleting the batch', function() {
            scenario = DELETE_BATCH_DB_ERROR_SCENARIO;
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });
        
        it('Return HTTP 200 if the batch is deleted successfully', function() {
            scenario = 'OK';
            batch.deleteBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });
});