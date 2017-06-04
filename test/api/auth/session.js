const session = require('../../../api/auth/session');
const should = require('should');
const sinon = require('sinon');
const userModel = require('../../../api/v1/model/user');
const jwt = require('jsonwebtoken');

describe('=== Session Management ===', function() {
    describe('Create a new client session', function() {
        var response = {};
        beforeEach(function() {
            // Create a fake response object
            response.redirect = sinon.spy();
            response.setCookie = sinon.spy();
        });

        //Start testing...
        it('A cookie with name \'tutor-buddy-session\' is set', function() {
            session.createNewClientSession('userID', 'sessionId', response, null);
            response.setCookie.getCall(0).args[0].should.equal('tutor-buddy-session');
        });

        it('A cookie with path \'/\' is set', function() {
            session.createNewClientSession('userID', 'sessionId', response, null);
            response.setCookie.getCall(0).args[2].path.should.equal('/');
        });

        it('The session cookie is HttpOnly', function() {
            session.createNewClientSession('userID', 'sessionId', response, null);
            response.setCookie.getCall(0).args[2].httpOnly.should.equal(true);
        });

        it('A cookie with the value of the provided session id is set', function() {
            session.createNewClientSession('userID', 'sessionId12345', response, null);
            response.setCookie.getCall(0).args[1].should.equal('sessionId12345');
        });

        it('The user should be redirected to the /dashboard route', function() {
            session.createNewClientSession('userID', 'sessionId12345', response, null);
            response.redirect.getCall(0).args[0].should.equal('/dashboard');
        });
    });

    describe('Create a new server session', function() {
        var callback;
        beforeEach(function() {
            sinon.spy(jwt, 'sign');
            sinon.stub(userModel, 'createNewSession').callsFake(function(userId, sessionId, callback) {
                callback(null); //null indicates that there was no error. callback(new Error()) would simulate createNewSession causing an error
            });
            callback = sinon.spy();
        });

        afterEach(function() {
            jwt.sign.restore();
            userModel.createNewSession.restore();
        });

        it('JWT is generated with userID attribute and value', function() {
            session.createNewServerSessionForUser('MyUser123', callback);
            jwt.sign.getCall(0).args[0].user.should.equal('MyUser123');
        });

        it('JWT is generated with expiry in 30 days', function() {
            session.createNewServerSessionForUser('MyUser123', callback);
            jwt.sign.getCall(0).args[0].expiresIn.should.equal('30d');
        });

        it('After server session is created in DB, callback is triggered with the session ID', function() {
            session.createNewServerSessionForUser('MyUser123', callback);
            callback.getCall(0).args[1].should.be.not.empty();
        });

        it('If DB operation fails, callback is triggered with the DB error propagated', function() {
            // Stubbing createNewSession to throw an error.. only for this test.
            userModel.createNewSession.restore();
            sinon.stub(userModel, 'createNewSession').callsFake(function(userId, sessionId, callback) {
                callback(new Error());
            });

            session.createNewServerSessionForUser('MyUser123', callback);
            callback.getCall(0).args[0].should.be.not.undefined();
        });
    });

    describe('Validate a user session', function() {
        var validToken = jwt.sign({
            user: 'MyUser123',
            expiresIn: '30d'
        }, session.jwtSecret);

        var wrongSecretToken = jwt.sign({
            user: 'MyUser123',
            expiresIn: '30d'
        }, 'incorrectSecret');

        var malformedToken = "jdhsagdjsadska";

        // var expiredToken = jwt.sign({
        //     user: 'MyUser123',
        //     expiresIn: '-1'
        // }, session.jwtSecret);

        beforeEach(function() {
            sinon.spy(jwt, 'verify');
        });

        afterEach(function() {
            jwt.verify.restore();
        });

        it('If the session token is valid, returns the decoded object with user ID', function() {
            session.parseJWTToken(validToken).user.should.equal('MyUser123');
        });

        it('If the session token is signed with an incorrect secret, returns \'JSONWebTokenError:invalid signature\' error', function() {
            should(function parseJWTToken() { session.parseJWTToken(wrongSecretToken) }).throw('invalid signature');
        });

        it('If the session token is malformed, returns \'JSONWebTokenError:jwt malformed\' error', function() {
            should(function parseJWTToken() { session.parseJWTToken(malformedToken) }).throw('jwt malformed');
        });

        it('If the session token is expired, returns ?? error');
    });

    describe('Terminate a user session', function() {
        //Create a fake request object
        var requestWithUserId = {
            user: {
                id: '1234'
            }
        };

        var requestWithoutUserId = {
        };

        var response;
        beforeEach(function() {
            // Create a fake response object
            response = {
                clearCookie: sinon.spy(),
                redirect: sinon.stub().callsFake(function(path, next) {
                    next();
                })
            };

            // Stub the userModel.terminateSession method
            sinon.stub(userModel, 'terminateSession').callsFake(function(userId, callback) {
                callback(); // In productive code, this callback gets triggered once the DB operation has finished
            });
        });

        afterEach(function() {
            userModel.terminateSession.restore();
        });

        // Start testing...
        it('If no user ID is available, an attempt to terminate session is not made', function() {
            session.terminateUserSession(requestWithoutUserId, response, () => {});
            userModel.terminateSession.calledOnce.should.equal(false);
        });

        it('If user ID is available, the userModel.terminateSession method is triggered and user ID is passed', function() {
            session.terminateUserSession(requestWithUserId, response, () => {});
            userModel.terminateSession.getCall(0).args[0].should.equal('1234');
        });

        it('If user ID is available, the session cookie \'tutor-buddy-session\' is cleared in the response', function() {
            session.terminateUserSession(requestWithUserId, response, () => {});
            response.clearCookie.getCall(0).args[0].should.equal('tutor-buddy-session');
        });

        it('If user ID is available, the user is redirected to the home page', function() {
            session.terminateUserSession(requestWithUserId, response, () => {});
            response.redirect.getCall(0).args[0].should.equal('/');
        });

        it('If userModel.terminateSession results in an error, the error is propagated', function() {
            // Stub the userModel.terminateSession method differently (to throw an error) only for this test
            userModel.terminateSession.restore();
            sinon.stub(userModel, 'terminateSession').callsFake(function(userId, callback) {
                callback(new Error());
            });

            should(function terminateUserSession() { session.terminateUserSession(requestWithUserId, response, () => {});}).throw();
        });
    });
});