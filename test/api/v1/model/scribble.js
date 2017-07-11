const scribbleModel = require('../../../api/v1/model/scribble');
const batchModel = require('../../../api/v1/model/batch');
const tutorModel = require('../../../api/v1/model/tutor');
const userModel = require('../../../api/v1/model/user');

describe('=== Scribble Model ===', function() {
    describe('Get scribble for a batch', function() {
        beforeEach(function(done) {
            // TODO: Create modelUtil methods to set up and tear down data in the test DB.
        });

        afterEach(function() {

        });

        it('If a scribble isn\'t found, return an empty string', function(done) {
            scribbleModel.getScribbleForBatch(9999, function(error, result) {
                result.should.equal('');
                done();
            });
        });

        it('If a scribble is found, return the found string', function(done) {
            scribbleModel.getScribbleForBatch(1, function(error, result) {
                result.should.equal('ScribbleContent');
                done();
            });
        });
    });
});