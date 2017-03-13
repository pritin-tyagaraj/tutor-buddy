var apiConnector = angular.module('apiConnector');
apiConnector.factory('tbUserService', function($http, $q) {

    var cache = {
        userProfile: null
    };

    return {
        /**
         * Gets the user info (like first_name, last_name) from the API
         */
        getUserProfile: function() {
            var deferred = $q.defer();
            if (cache.userProfile) {
                deferred.resolve(cache.userProfile);
            } else {
                $http.get('/api/v1/user').then(function(response) {
                    cache.userProfile = response.data;
                    deferred.resolve(cache.userProfile);
                }, function(data, status, headers, config) {
                    deferred.reject();
                });
            }
            return deferred.promise;
        },

        /**
         * Returns the current user's profile
         */
        getCurrentUser: function() {
            return cache.userProfile;
        },

        createTutorProfile: function() {
            var deferred = $q.defer();
            $http.post('/api/v1/tutor').then(function(response) {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject(data, status);
            });
            return deferred.promise;
        }
    };
});