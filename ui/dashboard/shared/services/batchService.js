var apiConnector = angular.module('apiConnector');
apiConnector.factory('tbBatchService', function($http, $q) {
    return {
        /**
         * Gets the list of existing batches for the current user.
         */
        getBatchesForUser: function() {
            var deferred = $q.defer();
            $http.get('/api/v1/batches').then(function(response) {
                deferred.resolve(response.data);
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        },

        /**
         * Creates a new batch for a tutor
         */
        createBatch: function(tutorId, batchDetails) {
            var deferred = $q.defer();
            $http.post('/api/v1/tutor/' + tutorId + '/batches', batchDetails).then(function(response) {
                deferred.resolve(response.data);
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        },

        /**
         * Triggers deletion of the specified batch
         */
        deleteBatch: function(batchId) {
            var deferred = $q.defer();
            $http.delete('/api/v1/batch/' + batchId).then(function() {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        },

        /**
         * Adds a new student to the specified batch
         */
        addStudent: function(batchId, studentDetails) {
            var deferred = $q.defer();
            $http.post('/api/v1/batch/' + batchId + '/students', studentDetails).then(function() {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        },

        /**
         * Removes a student from a batch
         */
        removeStudent: function(batchId, studentId) {
            var deferred = $q.defer();
            $http.delete('/api/v1/batch/' + batchId + '/student/' + studentId).then(function() {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        },

        /**
         * Returns all students in a particular batch
         */
        getStudentsForBatch: function(batchId) {
            var deferred = $q.defer();
            $http.get('/api/v1/batch/' + batchId + '/students').then(function(response) {
                deferred.resolve(response.data);
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }
    };
});