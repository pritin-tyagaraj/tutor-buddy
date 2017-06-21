const scribble = require('../../../api/v1/scribble');
const scribbleModel = require('../../../api/v1/model/scribble');
const batchModel = require('../../../api/v1/model/batch');
const sinon = require('sinon');
const should = require('should');

describe('=== Scribble API ===', function() {
    describe('Get scribbles for a batch', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var BATCH_NOT_FOUND_SCENARIO = 'BATCH_NOT_FOUND_SCENARIO';
        var USER_NOT_BATCH_OWNER_SCENARIO = 'USER_NOT_BATCH_OWNER_SCENARIO';
        var GET_SCRIBBLE_FOR_BATCH_ERROR_SCENARIO = 'GET_SCRIBBLE_FOR_BATCH_ERROR_SCENARIO';
        var ALL_OK_SCENARIO = 'ALL_OK_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            params: {}
        };

        var response = {

        };

        var next;

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                // First parameter when invoking callback = error object, second parameter = batch's owner's ID
                if(scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === BATCH_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else if (scenario === USER_NOT_BATCH_OWNER_SCENARIO) {
                    callback(null, 'SomeOtherUser');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(scribbleModel, 'getScribbleForBatch').callsFake(function(batchId, callback) {
                if(scenario === GET_SCRIBBLE_FOR_BATCH_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === ALL_OK_SCENARIO) {
                    callback(null, "My scribble");
                }
            });

            response.json = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            scribbleModel.getScribbleForBatch.restore();
            batchModel.getBatchOwner.restore();
        });

        it('Respond with HTTP 500 if error occurs while trying to find an owner for the provided batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            scribble.getScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Respond with HTTP 400 if the provided batch doesn\'t exist', function() {
            scenario = BATCH_NOT_FOUND_SCENARIO;
            scribble.getScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Respond with HTTP 403 if the current user doesn\'t own this batch', function() {
            scenario = USER_NOT_BATCH_OWNER_SCENARIO;
            scribble.getScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Respond with HTTP 500 if error occurs while fetching scribble for a batch', function() {
            scenario = GET_SCRIBBLE_FOR_BATCH_ERROR_SCENARIO;
            scribble.getScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return scribble with HTTP 200 if all is OK', function() {
            scenario = ALL_OK_SCENARIO;
            scribble.getScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
            response.json.getCall(0).args[1].content.should.equal("My scribble");
        });
    });

    describe('Update the scribble for a batch', function() {
        var GET_BATCH_OWNER_ERROR_SCENARIO = 'GET_BATCH_OWNER_ERROR_SCENARIO';
        var BATCH_NOT_FOUND_SCENARIO = 'BATCH_NOT_FOUND_SCENARIO';
        var USER_NOT_BATCH_OWNER_SCENARIO = 'USER_NOT_BATCH_OWNER_SCENARIO';
        var UPDATE_SCRIBBLE_ERROR_SCENARIO = 'UPDATE_SCRIBBLE_ERROR_SCENARIO';
        var ALL_OK_SCENARIO = 'ALL_OK_SCENARIO';
        var scenario;

        var request = {
            user: {
                id: 'User'
            },
            body: {
                content: "My scribble"
            },
            params: {}
        };

        var response = {
        };

        var next;

        beforeEach(function() {
            sinon.stub(batchModel, 'getBatchOwner').callsFake(function(batchId, callback) {
                // First parameter when invoking callback = error object, second parameter = batch's owner's ID
                if(scenario === GET_BATCH_OWNER_ERROR_SCENARIO) {
                    callback(new Error());
                } else if (scenario === BATCH_NOT_FOUND_SCENARIO) {
                    callback(null, null);
                } else if (scenario === USER_NOT_BATCH_OWNER_SCENARIO) {
                    callback(null, 'SomeOtherUser');
                } else {
                    callback(null, 'User');
                }
            });

            sinon.stub(scribbleModel, 'updateScribbleForBatch').callsFake(function(batchId, scribbleContent, callback) {
                if(scenario === UPDATE_SCRIBBLE_ERROR_SCENARIO) {
                    callback(new Error());
                } else {
                    callback(null);
                }
            });

            next = sinon.spy();
            response.json = sinon.spy();
        });

        afterEach(function() {
            scribbleModel.updateScribbleForBatch.restore();
            batchModel.getBatchOwner.restore();
        });

        it('Respond with HTTP 500 if error occurs while trying to find an owner for the provided batch', function() {
            scenario = GET_BATCH_OWNER_ERROR_SCENARIO;
            scribble.updateScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Respond with HTTP 400 if the provided batch doesn\'t exist', function() {
            scenario = BATCH_NOT_FOUND_SCENARIO;
            scribble.updateScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('Respond with HTTP 403 if the current user doesn\'t own this batch', function() {
            scenario = USER_NOT_BATCH_OWNER_SCENARIO;
            scribble.updateScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(403);
        });

        it('Returns HTTP 500 if there is an error while updating the batch\'s scribble', function() {
            scenario = UPDATE_SCRIBBLE_ERROR_SCENARIO;
            scribble.updateScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(500);
        });

        it('Return scribble with HTTP 200 if all is OK', function() {
            scenario = ALL_OK_SCENARIO;
            scribble.updateScribbleForBatch(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
        });
    });
});