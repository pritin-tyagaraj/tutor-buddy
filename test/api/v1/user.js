const user = require('../../../api/v1/user');
const session = require('../../../api/auth/session');
const userModel = require('../../../api/v1/model/user');
const tutorModel = require('../../../api/v1/model/tutor');
const sinon = require('sinon');
const nock = require('nock');
const should = require('should');

describe('=== User API ===', function() {
    var tutorUserId = 'TUTOR';
    var tutorWithNonFetchableProfile = 'TUTOR_NO_PROFILE';
    var notATutorUserId = 'NOT_TUTOR';
    var errorUserId = 'ERROR';

    function fakeIsUserTutor(userId, callback) {
        if(userId === notATutorUserId) {
            callback(null, false);
        } else if (userId === tutorUserId || userId === tutorWithNonFetchableProfile) {
            callback(null, true);
        } else if(userId === errorUserId) {
            callback(new Error());
        }
    }

    describe('Get details of the current user', function() {
        var badUser = 'BAD';
        var request = {
            user: {}
        };
        var response = {};

        beforeEach(function() {
            sinon.stub(userModel, 'getUserProfile').callsFake(function(userId, callback) {
                if(userId === badUser) {
                    callback(new Error());
                } else {
                    callback(null, {the: 'response'});
                }
            });
            response.json = sinon.spy();
        });

        afterEach(function() {
            userModel.getUserProfile.restore();
        });

        it('Calls the user.getUserProfile model method', function() {
            request.user.id = 'SomeUser';
            user.getCurrentUser(request, response, null);
            userModel.getUserProfile.calledOnce.should.equal(true);
            response.json.getCall(0).args[0].should.equal(200);
            response.json.getCall(0).args[1].should.eql({the: 'response'});
        });

        it('Throws an error if the user could not be loaded from the model', function() {
            request.user.id = badUser;
            should(function() { user.getCurrentUser(request, response, null); }).throw();
        });
    });

    describe('Login returning Facebook user or create a new Facebook', function() {
        var EXISTING_FACEBOOK_ID = 'ExistingFBId';
        var UNREGISTERED_FACEBOOK_ID = 'UnregisteredFBId';
        var EXISTING_TB_USER_ID = 'ExistingUserId';
        var getFBUserDetails;
        beforeEach(function() {
            sinon.stub(userModel, 'readByFacebookId').callsFake(function(facebookId, callback) {
                if(facebookId === EXISTING_FACEBOOK_ID) {
                    callback(null, {
                        id: EXISTING_TB_USER_ID
                    });
                } else {
                    callback({
                        code: 404
                    });
                }
            });
            sinon.stub(userModel, 'createNewUser').callsFake(function(firstName, lastName, email, facebook_id, access_token, callback) {
                callback(null, "DB_USER_ID");
            });

            sinon.stub(session, 'createNewServerSessionForUser').callsFake(function(userId, callback) {
                callback(null, 'NEW_SESSION_ID');
            });
            sinon.stub(session, 'createNewClientSession').callsFake(function(dbUserId, sessionId, res, next) {
                next();
            });

            getFBUserDetails = nock('https://graph.facebook.com')
                .get('/v2.8/' + UNREGISTERED_FACEBOOK_ID)
                .query(function() {
                    return true;
                })
                .reply(200, {
                    first_name: "FIRST_NAME",
                    last_name: "LAST_NAME",
                    email: "EMAIL"
                });
        });

        afterEach(function() {
            userModel.readByFacebookId.restore();
            session.createNewServerSessionForUser.restore();
            session.createNewClientSession.restore();
            userModel.createNewUser.restore();
        });

        it('If a facebook ID isn\'t present, do nothing', function() {
            user.loginOrCreateUser(null, null, null, null);
            userModel.readByFacebookId.calledOnce.should.equal(false);
        });

        it('If user already exists, create a new client and server session', function() {
            user.loginOrCreateUser(EXISTING_FACEBOOK_ID, null, null, function(){});
            session.createNewServerSessionForUser.calledOnce.should.equal(true);
            session.createNewClientSession.calledOnce.should.equal(true);
            session.createNewClientSession.getCall(0).args[1].should.equal('NEW_SESSION_ID');
        });

        it('If FB user is a new user, create a new TB user and create a new session', function(done) {
            user.loginOrCreateUser(UNREGISTERED_FACEBOOK_ID, null, null, function() {
                userModel.createNewUser.calledOnce.should.equal(true);
                session.createNewClientSession.calledOnce.should.equal(true);
                session.createNewServerSessionForUser.calledOnce.should.equal(true);
                done();
            });
        });
    });

    describe('Create a tutor profile for the current user', function() {
        var request = {
            user: {}
        };
        var response = {

        };
        var next;

        var createTutorProfileScenario;
        beforeEach(function() {
            sinon.stub(userModel, 'isUserTutor').callsFake(fakeIsUserTutor);
            sinon.stub(tutorModel, 'createTutorProfile').callsFake(function(userId, callback) {
                if(createTutorProfileScenario === 'ERROR') {
                    callback(new Error());
                } else {
                    callback(null, "TutorId");
                }
            });

            response.header = sinon.spy();
            response.send = sinon.spy();
            response.json = sinon.spy();
            next = sinon.spy();
        });

        afterEach(function() {
            userModel.isUserTutor.restore();
            tutorModel.createTutorProfile.restore();

            delete response.header;
            delete response.send;
            delete response.json;

            createTutorProfileScenario = '';
        });


        it('If user is already a tutor, return HTTP 400', function() {
            request.user.id = tutorUserId;
            user.createTutorProfile(request, response, next);
            response.json.getCall(0).args[0].should.equal(400);
        });

        it('If there is an error in determining whether the user is a tutor, throw an error', function() {
            request.user.id = errorUserId;
            should(function() { user.createTutorProfile(request, response, next); }).throw();
        });

        it('If there is an error in tutorModel.createTutorProfile, propagate error to next(err)', function() {
            createTutorProfileScenario = 'ERROR';
            request.user.id = notATutorUserId;
            user.createTutorProfile(request, response, next);
            next.getCall(0).args[0].should.not.be.undefined();
        });

        it('If tutorModel.createTutorProfile is successful, send an appropriate response', function() {
            request.user.id = notATutorUserId;
            user.createTutorProfile(request, response, next);
            response.header.getCall(0).args[0].should.equal('resource');
            response.header.getCall(0).args[1].should.equal('TutorId');
            response.send.getCall(0).args[0].should.equal(201);
        });
    });

    describe('Get the tutor profile of the current user', function() {
        var next;
        var request = {
            user: {
            }
        };

        var response = {

        };

        beforeEach(function() {
            sinon.stub(userModel, 'isUserTutor').callsFake(fakeIsUserTutor);
            sinon.stub(tutorModel, 'getTutorProfile').callsFake(function(userId, callback) {
                if(userId === tutorWithNonFetchableProfile) {
                    callback(new Error());
                } else {
                    callback(null, {}); // 2nd Param = Result from DB
                }
            });

            next = sinon.spy();
            response.json = sinon.spy();
        });

        afterEach(function() {
            userModel.isUserTutor.restore();
            tutorModel.getTutorProfile.restore();
            delete response.json;
        });

        it('If user isn\'nt a tutor, return HTTP 404', function() {
            request.user.id = notATutorUserId;
            user.getTutorProfile(request, response, next);
            response.json.calledOnce.should.equal(true);
            response.json.getCall(0).args[0].should.equal(404);
            tutorModel.getTutorProfile.calledOnce.should.equal(false);
        });

        it('If there is an error in determining if user is a tutor, throw an error', function() {
            request.user.id = errorUserId;
            should(function () { user.getTutorProfile(request, response, next); }).throw();
        });

        it('If user is a tutor but profile can\'t be loaded, pass error to next() handler', function() {
            request.user.id = tutorWithNonFetchableProfile;
            user.getTutorProfile(request, response, next);
            next.getCall(0).args[0].should.not.be.undefined;
        });

        it('If user is tutor and profile can be loaded, return HTTP 200', function() {
            request.user.id = tutorUserId;
            user.getTutorProfile(request, response, next);
            response.json.getCall(0).args[0].should.equal(200);
            response.json.getCall(0).args[1].should.not.be.undefined;
        });
    });
});