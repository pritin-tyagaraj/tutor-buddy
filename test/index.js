'use strict';

var supertest = require('supertest');
var should = require('should');

// Set the process to 'test' mode
process.env.mode = 'TEST';

// Where's the app that we're testing?
var app = require('../app');
var server = supertest.agent('http://localhost:8080');

describe('Authentication Token/Session ID', function() {
    it('Error if invalid session ID token is provided', function(done) {
        server.get('/dashboard')
            .set('Cookie', 'tutor-buddy-session=dsada')
            .expect(401)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('Redirect to authentication path if empty token is provided', function(done) {
        server.get('/dashboard')
            .set('Cookie', 'tutor-buddy-session=')
            .expect('location', '/auth/facebook/login')
            .expect(302)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('Error if expired session ID token is provided');
});

describe('Facebook authentication', function() {
    it('Authentication path redirects to Facebook login dialog');
    it('Logout path deletes client cookie');
    it('Logout path deletes server session ID');
});

describe('Static files without authentication', function() {
    it('/index.html is available', function(done) {
        server.get('/')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('/fb-access-denied.html is available', function(done) {
        server.get('/fb-access-denied.html')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('/xyz-does-not-exist.html should return 404');
});

describe('Static files with authentication', function() {
    it('/dashboard redirects to authentication path', function(done) {
        server.get('/dashboard')
            .expect('location', '/auth/facebook/login')
            .expect(302)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });

    it('/dashboard/does-not-exist (requires auth, but doesn\'t exist) redirects to authentication path');
});