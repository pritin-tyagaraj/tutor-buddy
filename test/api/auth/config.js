const should = require('should');

describe('=== Authentication Configuration Strings ===', function() {

    it('Expected strings returned in DEV mode', function() {
        process.env.MODE = 'TEST';

        // Load the config module again, since we've changed the mode
        var name = require.resolve('../../../api/auth/config');
        delete require.cache[name];
        var config = require('../../../api/auth/config');

        // Tests
        config.FACEBOOK_LOGIN_URL.should.equal('https://www.facebook.com/v2.8/dialog/oauth?client_id=%s&scope=%s&redirect_uri=%s');
        config.FACEBOOK_REDIRECT_URL.should.equal('http://localhost:8080/auth/facebook/redirect');
        config.FACEBOOK_GET_TOKEN_URL.should.equal('https://graph.facebook.com/v2.8/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s');
        config.FACEBOOK_TOKEN_REDIRECT_URL.should.equal('http://localhost:8080/auth/faceook/handle_token');
        config.FACEBOOK_INSPECT_TOKEN_URL.should.equal('https://graph.facebook.com/debug_token?input_token=%s&access_token=%s');
        config.FACEBOOK_PERMISSIONS.should.equal('public_profile,email');
        process.env.MODE = 'production';
    });

    it('Expected strings returned in PRODUCTION mode', function() {
        process.env.MODE = 'production';

        // Load the config module again, since we've changed the mode
        var name = require.resolve('../../../api/auth/config');
        delete require.cache[name];
        var config = require('../../../api/auth/config');

        // Tests
        config.FACEBOOK_LOGIN_URL.should.equal('https://www.facebook.com/v2.8/dialog/oauth?client_id=%s&scope=%s&redirect_uri=%s');
        config.FACEBOOK_REDIRECT_URL.should.equal('https://tutorbuddy.logicbomb.in/auth/facebook/redirect');
        config.FACEBOOK_GET_TOKEN_URL.should.equal('https://graph.facebook.com/v2.8/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s');
        config.FACEBOOK_TOKEN_REDIRECT_URL.should.equal('https://tutorbuddy.logicbomb.in/auth/facebook/handle_token');
        config.FACEBOOK_INSPECT_TOKEN_URL.should.equal('https://graph.facebook.com/debug_token?input_token=%s&access_token=%s');
        config.FACEBOOK_PERMISSIONS.should.equal('public_profile,email');
        process.env.MODE = 'TEST';
    });
});