var apiConnector = angular.module('apiConnector');
apiConnector.factory('tbUserService', function($http) {
    return {
        /**
         * Gets the user info (like first_name, last_name) from the API
         */
        getUserProfile: function() {
            return $http.get('/api/v1/user');
        },
    };
});