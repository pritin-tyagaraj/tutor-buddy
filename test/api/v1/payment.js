const payment = require('../../../api/v1/payment');
const paymentModel = require('../../../api/v1/model/payment');
const batchModel = require('../../../api/v1/model/batch');
const sinon = require('sinon');
const should = require('should');

describe('=== Payment API ===', function() {
    describe('Record a new payment', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var BATCH_NOT_FOUND_SCENARIO = 'BATCH_NOT_FOUND_SCENARIO';
        var USER_NOT_BATCH_OWNER_SCENARIO = 'USER_NOT_BATCH_OWNER_SCENARIO';
        var BATCH_HAS_STUDENT_ERROR_SCENARIO = 'BATCH_HAS_STUDENT_ERROR_SCENARIO';
        var STUDENT_NOT_IN_BATCH_SCENARIO = 'STUDENT_NOT_IN_BATCH_SCENARIO';
        var RECORD_PAYMENT_DB_GENERIC_ERROR_SCENARIO = 'RECORD_PAYMENT_DB_GENERIC_ERROR_SCENARIO';
        var RECORD_PAYMENT_FOREIGN_KEY_ERROR_SCENARIO = 'RECORD_PAYMENT_FOREIGN_KEY_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            body: {},
            params: {}
        };

        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                if(scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === BATCH_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else if (scenario === USER_NOT_BATCH_OWNER_SCENARIO) {
                    callback(null, 'Some other user');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(batchModel, 'hasStudent').callsFake(function(batchId, studentId, callback) {
                if(scenario === BATCH_HAS_STUDENT_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === STUDENT_NOT_IN_BATCH_SCENARIO) {
                    callback(null, false);
                } else {
                    callback(null, true);
                }
            });

            sinon.stub(paymentModel, 'recordPayment').callsFake(function(studentId, batchId, paymentMode, paymentAmount, paymentCurrency, paymentTime, tutorComment, callback) {
                if(scenario === RECORD_PAYMENT_DB_GENERIC_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === RECORD_PAYMENT_FOREIGN_KEY_ERROR_SCENARIO) {
                    var error = {
                        code: 'ER_NO_REFERENCED_ROW'
                    };
                    callback(error);
                } else {
                    callback(null);
                }
            });

            response.json = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            batchModel.getBatchOwner.restore();
            batchModel.hasStudent.restore();
            paymentModel.recordPayment.restore();
        });

        it('Return HTTP 500 if error occurs while finding out who owns the batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            payment.recordPayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 400 if the specified batch is\'nt found', function() {
            scenario = BATCH_NOT_FOUND_SCENARIO;
            payment.recordPayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 403 if the current user doesn\'t own the batch', function() {
            scenario = USER_NOT_BATCH_OWNER_SCENARIO;
            payment.recordPayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Return HTTP 500 if an error occurs while checking if the payment\'s student ID is part of this batch', function() {
            scenario = BATCH_HAS_STUDENT_ERROR_SCENARIO;
            payment.recordPayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 400 if the payment\'s student ID is not part of this batch', function() {
            scenario = STUDENT_NOT_IN_BATCH_SCENARIO;
            payment.recordPayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Return HTTP 500 if an unknown error occurs while recoring the payment', function(done) {
            scenario = RECORD_PAYMENT_DB_GENERIC_ERROR_SCENARIO;
            payment.recordPayment(request, response, function() {
                response.json.getCall(0).args[0].should.equal(500);
                done();
            });
        });

        it('Return HTTP 400 if a foreign key error (non-existent batch ID or student ID) occurs', function(done) {
            scenario = RECORD_PAYMENT_FOREIGN_KEY_ERROR_SCENARIO;
            payment.recordPayment(request, response, function() {
                response.json.getCall(0).args[0].should.equal(400);
                done();
            });

        });

        it('Return HTTP 201 if payment is recorded successfully', function(done) {
            scenario = 'OK';
            payment.recordPayment(request, response, function() {
                response.json.getCall(0).args[0].should.equal(201);
                done();
            });
        });
    });

    describe('List payments for a given batch', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var BATCH_NOT_FOUND_SCENARIO = 'BATCH_NOT_FOUND_SCENARIO';
        var USER_NOT_BATCH_OWNER_SCENARIO = 'USER_NOT_BATCH_OWNER_SCENARIO';
        var GET_PAYMENTS_DB_ERROR_SCENARIO = 'GET_PAYMENTS_DB_ERROR_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            params: {},
            query: {}
        };

        var response = {};
        var next;

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                if(scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === BATCH_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else if (scenario === USER_NOT_BATCH_OWNER_SCENARIO) {
                    callback(null, 'Some other user');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(paymentModel, 'getPaymentsForBatch').callsFake(function(batchId, studentFilter, callback) {
                if(scenario === GET_PAYMENTS_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null, []);
                }
            });

            response.json = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            batchModel.getBatchOwner.restore();
            paymentModel.getPaymentsForBatch.restore();
        });

        it('Return HTTP 500 if error occurs while finding out who owns the batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            payment.getPaymentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 404 if the specified batch isn\'t found', function() {
            scenario = BATCH_NOT_FOUND_SCENARIO;
            payment.getPaymentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(404);
        });

        it('Return HTTP 403 if the current user doesn\'t own the batch', function() {
            scenario = USER_NOT_BATCH_OWNER_SCENARIO;
            payment.getPaymentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Return HTTP 500 if an error occurs while fetching payment list from DB', function() {
            scenario = GET_PAYMENTS_DB_ERROR_SCENARIO;
            payment.getPaymentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 200 and result if the fetch is successful', function() {
            scenario = 'OK';
            payment.getPaymentsForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });

    describe('Delete a payment record', function() {
        var GET_PAYMENT_OWNER_ERROR_SCENARIO = 'GET_PAYMENT_OWNER_ERROR_SCENARIO';
        var USER_NOT_PAYMENT_OWNER_SCENARIO = 'USER_NOT_PAYMENT_OWNER_SCENARIO';
        var DELETE_PAYMENT_DB_ERROR_SCENARIO = 'DELETE_PAYMENT_DB_ERROR_SCENARIO';
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
            sinon.stub(paymentModel, 'getPaymentOwner').callsFake(function(paymentId, callback) {
                if(scenario === GET_PAYMENT_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === USER_NOT_PAYMENT_OWNER_SCENARIO) {
                    callback(null, 'SomeOtherUser');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(paymentModel, 'deletePayment').callsFake(function(paymentId, callback) {
                if(scenario === DELETE_PAYMENT_DB_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null);
                }
            });

            response.json = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            paymentModel.getPaymentOwner.restore();
            paymentModel.deletePayment.restore();
        });

        it('Return HTTP 500 if error occurs while determining who owns the payment record', function() {
            scenario = GET_PAYMENT_OWNER_ERROR_SCENARIO;
            payment.deletePayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 403 if current user is not the owner for the payment record', function() {
            scenario = USER_NOT_PAYMENT_OWNER_SCENARIO;
            payment.deletePayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Return HTTP 500 if a DB error occurs while deleting the payment record', function() {
            scenario = DELETE_PAYMENT_DB_ERROR_SCENARIO;
            payment.deletePayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return HTTP 200 if the payment is deleted successfully', function() {
            scenario = 'OK';
            payment.deletePayment(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });
});