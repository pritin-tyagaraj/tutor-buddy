const whitelist = require('../../../api/auth/whitelist');
const session = require('../../../api/auth/session');
const validateRequest = require('../../../api/middleware/validateRequest');
const sinon = require('sinon');
const should = require('should');

describe('=== Request Validation Middleware ===', function() {
    var next;
    var request = {
        cookies: {

        }
    };
    var response = {

    };

    beforeEach(function() {
        sinon.stub(whitelist, 'isAllowed').callsFake(function(route) {
            return (route === 'WHITELISTED');
        });

        sinon.stub(session, 'parseJWTToken').callsFake(function(sessionId) {
            var error;
            if(sessionId === 'EXPIRED') {
                error = new Error();
                error.name = 'TokenExpiredError';
                throw error;
            } else if (sessionId === 'MALFORMED') {
                error = new Error();
                error.name = 'MalformedJWTError';
                throw error;
            } else if (sessionId === 'VALID') {
                return {
                    user: 'LegitUser'
                };
            }
        });

        response.redirect = sinon.spy();
        response.send = sinon.spy();
        next = sinon.spy();
    });

    afterEach(function() {
        whitelist.isAllowed.restore();
        session.parseJWTToken.restore();
        delete response.redirect;
        delete response.send;
    });

    it('For whitelisted routes, authentication is skipped', function() {
        request.url = 'WHITELISTED';
        validateRequest.checkUserAuthentication(request, response, next);
        next.calledOnce.should.equal(true);
    });

    it('If session cookie is missing, user is redirected to login page', function() {
        request.url = 'NOT_WHITELISTED';
        validateRequest.checkUserAuthentication(request, response, next);
        response.redirect.getCall(0).args[0].should.equal('/auth/facebook/login');
        response.redirect.getCall(0).args[1].should.equal(next);
    });

    it('If session cookie is expired, user is redirected to login page', function() {
        request.url = 'NOT_WHITELISTED';
        request.cookies['tutor-buddy-session'] = 'EXPIRED';
        validateRequest.checkUserAuthentication(request, response, next);
        response.redirect.getCall(0).args[0].should.equal('/auth/facebook/login');
    });

    it('If session cookie is malformed, HTTP 401 response is sent', function() {
        request.url = 'NOT_WHITELISTED';
        request.cookies['tutor-buddy-session'] = 'MALFORMED';
        validateRequest.checkUserAuthentication(request, response, next);
        response.send.getCall(0).args[0].should.equal(401);
    });

    it('If session cookie is valid, user ID is attached to the request object and the next handler is invoked', function() {
        request.url = 'NOT_WHITELISTED';
        request.cookies['tutor-buddy-session'] = 'VALID';
        validateRequest.checkUserAuthentication(request, response, next);
        request.user.id.should.equal('LegitUser');
        next.calledOnce.should.equal(true);
    });
});