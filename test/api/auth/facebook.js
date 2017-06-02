const facebook = require('../../../api/auth/facebook');
const user = require('../../../api/v1/user');
const sinon = require('sinon');
const should = require('should');
const winston = require('winston');
const nock = require('nock');

describe('=== Authentication ===', function() {
    describe('Facebook', function() {
        describe('Facebook routes are configured on the server', function() {
            // Stub the 'server' objeect on which the routes are registered
            var server = {
                get: sinon.spy()
            };

            // Test
            facebook.initServerRoutes(server);

            // Assertions
            it('Registers the login route', function() {
                server.get.getCall(0).args[0].should.equal('/auth/facebook/login');
            });

            it('Registers the logout route', function() {
                server.get.getCall(1).args[0].should.equal('/auth/facebook/logout');
            });

            it('Registers the redirect route', function() {
                server.get.getCall(2).args[0].should.equal('/auth/facebook/redirect');
            });
        });

        describe('User is redirected to Facebook to trigger login', function() {
            // Stub Restify's response object
            var response = {
                redirect: sinon.spy()
            };

            // Test
            facebook.triggerUserLogin(null, response, null);

            // Assertions
            it('Redirected URL is a Facebook URL', function() {
                response.redirect.getCall(0).args[0].should.startWith('https://www.facebook.com');
            });
        });

        describe('Handle Facebook\'s response when user denies access', function() {
            // Create a fake request. Stub the response object
            var request = {
                url: 'https://tutorbuddy.logicbomb.in/auth/facebook/redirect?error=access_denied'
            };
            var response = {
                redirect: sinon.spy()
            };

            // Test
            facebook.handleLoginCodeResponse(request, response, null);

            // Assertions
            it('User is redirected to /fb-access-denied.html', function() {
                response.redirect.getCall(0).args[0].should.equal('/fb-access-denied.html');
            });
        });

        describe('Exchange Facebook\'s code for access token (access token is ok)', function() {
            // Fake a request from Facebook providing a code
            var request = {
                url: 'https://tutorbuddy.logicbomb.in/auth/facebook/redirect?code=mycode'
            };

            // Assertions
            var getAccessToken, inspectAccessToken;
            beforeEach(function() {
                // Mock Facebook's response providing access token
                getAccessToken = nock('https://graph.facebook.com')
                    .get('/v2.8/oauth/access_token')
                    .query(function() {
                        return true;
                    })
                    .reply(200, {
                        access_token: '12345'
                    });

                // Mock Facebook's response for inspecting an access token
                inspectAccessToken = nock('https://graph.facebook.com')
                    .get('/debug_token')
                    .query(function() {
                        return true;
                    })
                    .reply(200, {
                        data: {
                            user_id: '98765'
                        }
                    });

                // Stub the call to the 'user' API method 'loginOrCreateUser'. The API layer will be tested with separate tests
                sinon.stub(user, 'loginOrCreateUser', function(userId, accessToken, response, next) {
                    next();
                });
            });

            afterEach(function() {
                user.loginOrCreateUser.restore();
            });

            it('Request sent to Facebook to fetch access token', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    getAccessToken.isDone().should.equal(true);
                    done();
                });
            });

            it('Request sent to Facebook to inspect the access token', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    inspectAccessToken.isDone().should.equal(true);
                    done();
                });
            });

            it('user.loginOrCreateUser API is invoked and the received user id is passed', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    user.loginOrCreateUser.getCall(0).args[0].should.equal('98765');
                    done();
                });
            });

            it('user.loginOrCreateUser API is invoked and the received access token is passed', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    user.loginOrCreateUser.getCall(0).args[1].should.equal('12345');
                    done();
                });
            });
        });

        describe('Exchange Facebook\'s code for access token (access token cannot be verified)', function() {
            // Fake a request from Facebook providing a code
            var request = {
                url: 'https://tutorbuddy.logicbomb.in/auth/facebook/redirect?code=mycode'
            };

            beforeEach(function() {
                // Mock Facebook's response providing access token
                getAccessToken = nock('https://graph.facebook.com')
                    .get('/v2.8/oauth/access_token')
                    .query(function() {
                        return true;
                    })
                    .reply(200, {
                        access_token: '12345'
                    });

                // Mock Facebook's response for inspecting an access token
                inspectAccessToken = nock('https://graph.facebook.com')
                    .get('/debug_token')
                    .query(function() {
                        return true;
                    })
                    .reply(200, {
                        data: {
                            error: "Not a valid access token"
                        }
                    });

                // Stub the call to the 'user' API method 'loginOrCreateUser'. The API layer will be tested with separate tests.
                sinon.spy(user, 'loginOrCreateUser');
            });

            afterEach(function() {
                user.loginOrCreateUser.restore();
            });

            // Assertions
            it('Request sent to Facebook to fetch access token', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    getAccessToken.isDone().should.equal(true);
                    done();
                });
            });

            it('Request sent to Facebook to inspect the access token', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    inspectAccessToken.isDone().should.equal(true);
                    done();
                });
            });

            it('user.loginOrCreateUser is not invoked', function(done) {
                facebook.handleLoginCodeResponse(request, null, function() {
                    user.loginOrCreateUser.calledOnce.should.equal(false);
                    done();
                });
            });
        });
    });
});