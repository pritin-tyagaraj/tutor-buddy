var apiConnector = angular.module('apiConnector');
apiConnector.factory('tbBatchService', function($http) {
    return {
        /**
         * Gets the list of existing batches for the current user.
         */
        getBatchesForUser: function() {
            return $http.get('/api/v1/batches');
        },
    };
});