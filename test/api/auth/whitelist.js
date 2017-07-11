const whitelist = require('../../../api/auth/whitelist');
const should = require('should');

describe('=== Authentication Whitelist ===', function() {
    describe('Whitelist based on \'startsWith\' matching', function() {
        it('Routes starting with a whitelisted route are allowed', function() {
            whitelist.isAllowed('/welcome/hello').should.equal(true);
        });

        it('Routes exactly matching a whitelisted route are allowed', function() {
            whitelist.isAllowed('/welcome').should.equal(true);
        });
    });

    describe('Whitelist based on \'exact match\' matching', function() {
        it('Routes matching a whitelisted route are allowed', function() {
            whitelist.isAllowed('/auth/facebook/redirect').should.equal(true);
        });

        it('Routes starting with a whitelisted route are not allowed', function() {
            whitelist.isAllowed('/auth/facebook/redirectED').should.equal(false);
        });
    });
});
