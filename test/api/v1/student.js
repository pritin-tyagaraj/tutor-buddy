const student = require('../../../api/v1/student');
const batchModel = require('../../../api/v1/model/batch');
const studentModel = require('../../../api/v1/model/student');
const sinon = require('sinon');
const should = require('should');

describe('=== Student API ===', function() {
    describe('Add a student to a batch', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var USER_NOT_BATCH_OWNER_SCENARIO = 'USER_NOT_BATCH_OWNER_SCENARIO';
        var ADD_STUDENT_DB_ERROR = 'ADD_STUDENT_DB_ERROR';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            params: {},
            body: {}
        };

        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                if(scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === USER_NOT_BATCH_OWNER_SCENARIO) {
                    callback(null, 'SomeOtherUser');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(studentModel, 'addStudentToBatch').callsFake(function(batchId, studentFirstName, studentLastName, studentPhone, studentEmail, callback) {
                if(scenario === ADD_STUDENT_DB_ERROR) {
                    callback(new Error());
                } else {
                    callback(null, 'CreatedStudentId');
                }
            });

            response.json = sinon.spy();
            response.send = sinon.spy();
            response.header = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            batchModel.getBatchOwner.restore();
            studentModel.addStudentToBatch.restore();
        });

        it('Return HTTP 500 if there is an error while getting the owner of the batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            student.addStudentToBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 403 if the user isn\'t the owner of this batch', function() {
            scenario = USER_NOT_BATCH_OWNER_SCENARIO;
            student.addStudentToBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Return HTTP 500 if there is an error while adding the student to the batch', function() {
            scenario = ADD_STUDENT_DB_ERROR;
            student.addStudentToBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 201 if the student is added successfully + set resource header', function() {
            scenario = 'OK';
            student.addStudentToBatch(request, response, next);
            response.send.getCall(0).args[0].should.equal(201);
            response.header.getCall(0).args[0].should.equal('resource');
            response.header.getCall(0).args[1].should.equal('CreatedStudentId');
        });
    });

    describe('Remove a student from a batch', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var REMOVE_STUDENT_DB_ERROR_SCENARIO = 'REMOVE_STUDENT_DB_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            params: {}
        };

        var response = {};
        var next = sinon.spy();

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                if(scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(studentModel, 'removeStudentFromBatch').callsFake(function(batchId, studentId, callback) {
                if(scenario === REMOVE_STUDENT_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null);
                }
            });

            response.json = sinon.spy();
        });

        afterEach(function() {
            batchModel.getBatchOwner.restore();
            studentModel.removeStudentFromBatch.restore();
        });

        it('Return HTTP 500 if there is an error while getting the owner of the batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            student.removeStudentFromBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 500 if there is a DB error while removing a student form a batch', function() {
            scenario = REMOVE_STUDENT_DB_ERROR_SCENARIO;
            student.removeStudentFromBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 200 if student is successfully removed from the batch', function() {
            scenario = 'OK';
            student.removeStudentFromBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });

    describe('List students in a batch', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var USER_NOT_BATCH_OWNER_SCENARIO = 'USER_NOT_BATCH_OWNER_SCENARIO';
        var GET_STUDENTS_DB_ERROR_SCENARIO = 'GET_STUDENTS_DB_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            params: {}
        };

        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                if (scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === USER_NOT_BATCH_OWNER_SCENARIO) {
                    callback(null, 'SomeOtherUser');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(studentModel, 'getStudentsInBatch').callsFake(function(batchId, callback) {
                if (scenario === GET_STUDENTS_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null, []);
                }
            });

            response.json = sinon.spy();
        });

        afterEach(function() {
            batchModel.getBatchOwner.restore();
            studentModel.getStudentsInBatch.restore();
        });

        it('Return HTTP 500 if there is an error while getting the owner of the batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            student.getStudentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 403 if the user isn\'t the owner of this batch', function() {
            scenario = USER_NOT_BATCH_OWNER_SCENARIO;
            student.getStudentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Return HTTP 500 if there is a DB error while fetching students list', function() {
            scenario = GET_STUDENTS_DB_ERROR_SCENARIO;student.getStudentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 200 if listing is successful', function() {
            scenario = 'OK';
            student.getStudentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });
});