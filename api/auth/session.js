const jwt = require('jsonwebtoken');
const config = require('../../config');
const jwtSecret = 'fc143f1edcc846edbc6c7e2302be5602';

function getModel() {
    return require(`../v1/model-${config.get('DATA_BACKEND')}`);
}

module.exports = {
    /**
     * Respond with an HTML page with a script, that sets the session ID to local storage and then redirects to the post-login landing page
     *
     * @param  {[type]} userId    [description]
     * @param  {[type]} sessionId [description]
     * @param  {[type]} res       [description]
     * @return {[type]}           [description]
     */
    createNewClientSession: function(userId, sessionId, res) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(
            `
            <html>
                <script>
                    localStorage.setItem('tutor-buddy-session', '${sessionId}');
                    // Redirect here...
                </script>
            </html>
        `
        );
    },

    createNewServerSessionForUser: function(userId, cb) {
        var sessionId = this.createNewJWTToken();
        getModel().user.createNewSession(userId, sessionId, () => {
            cb(sessionId);
        });
    },

    createNewJWTToken: function(userId) {
        return jwt.sign({
            user: userId,
            expiresIn: '30d'
        }, jwtSecret);
    }
};