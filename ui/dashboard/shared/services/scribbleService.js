var apiConnector = angular.module('apiConnector');
apiConnector.factory('tbScribbleService', function($http, $q) {
    return {
        /**
         * Saves a scribble for a batch
         */
        saveScribble: function(batchId, scribbleContent) {
            var deferred = $q.defer();
            var that = this;
            $http.post('/api/v1/batch/' + batchId + '/scribble', {
                content: JSON.stringify(scribbleContent.ops)
            }).then(function(response) {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject(data, status);
            });
            return deferred.promise;
        },

        /**
         * Gets the already-saved scribble content for a batch
         */
        getScribble: function(batchId) {
            var deferred = $q.defer();
            $http.get('/api/v1/batch/' + batchId + '/scribble').then(function(response) {
                deferred.resolve(JSON.parse(response.data.content));
            }, function(data, status, headers, config) {
                deferred.reject(data, status);
            });
            return deferred.promise;
        }
    };
});