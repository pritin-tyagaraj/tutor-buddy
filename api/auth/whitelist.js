'use strict';

var allowed = {
    startsWith: [
        '/welcome'
    ],
    exact: {
        '/auth/facebook/login': true,
        '/auth/facebook/redirect': true,
        '/auth/facebook/handle_token': true,
        '/': true,
        '/welcome/index.html': true,
        '/welcome/bootstrap/script.js': true,
        '/favicon.ico': true,
        '/fb-access-denied.html': true,
        '/.well-known/acme-challenge/1tvWlI0MKwAojMP-hjlFXmspUY9Nv_MfMKEI-bIfvrE': true,
        '/.well-known/acme-challenge/rfYoOSmZYMf1_TDAyBbCvcKyOlTFftW2j6Miy1ZTMFI': true
    }
};

module.exports = {
    isAllowed: function(path) {
        //Check starts with
        var bAllowed = allowed.startsWith.some(function(each) {
            if (path.indexOf(each) === 0) {
                return true;
            }
        });

        //Check exact paths
        if (bAllowed || allowed.exact[path]) {
            return true;
        } else {
            return false;
        }
    }
};