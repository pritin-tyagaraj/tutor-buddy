module.exports = {
    FACEBOOK_LOGIN_URL: 'https://www.facebook.com/v2.8/dialog/oauth?client_id=%s&scope=%s&redirect_uri=%s',
    FACEBOOK_REDIRECT_URL: process.env.MODE === 'production' ? 'https://tutor-buddy.appspot.com/auth/facebook/redirect' : 'http://localhost:8080/auth/facebook/redirect', //'https://tutor-buddy.appspot.com/auth/facebook/callback',
    FACEBOOK_GET_TOKEN_URL: 'https://graph.facebook.com/v2.8/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s',
    FACEBOOK_TOKEN_REDIRECT_URL: process.env.MODE === 'production' ? 'https://tutor-buddy.appspot.com/auth/facebook/handle_token' : 'http://localhost:8080/auth/faceook/handle_token',
    FACEBOOK_INSPECT_TOKEN_URL: 'https://graph.facebook.com/debug_token?input_token=%s&access_token=%s',
    FACEBOOK_APP_ID: process.env.FB_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FB_APP_SECRET,
    FACEBOOK_PERMISSIONS: 'public_profile,email'
}