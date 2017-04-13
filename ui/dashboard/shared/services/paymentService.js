var apiConnector = angular.module('apiConnector');
apiConnector.factory('tbPaymentService', function($http, $q) {
    return {
        /**
         * Records a payment by a student in a batch. This action is triggered by the tutor.
         */
        recordPayment: function(batchId, studentId, amount, time, tutorComment) {
            var deferred = $q.defer();
            var that = this;
            $http.post('/api/v1/batch/' + batchId + '/student/' + studentId + '/payments', {
                amount: amount,
                currency: 'INR',
                time: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                tutor_comment: tutorComment
            }).then(function(response) {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject(data, status);
            });
            return deferred.promise;
        },

        /**
         * Gets a list of recorded payments for the specified batch
         */
        getPaymentsForBatch: function(batchId, filterStudentId) {
            var deferred = $q.defer();
            var that = this;

            // Form the request URL
            var url = '/api/v1/batch/' + batchId + '/payments';
            if(filterStudentId) {
                url += '?student=' + filterStudentId
            }

            $http.get(url).then(function(response) {
                // For each date (payment date), convert the value to a local time Date object
                response.data.forEach(function(payment) {
                    payment.time = moment.utc(payment.time, 'YYYY-MM-DD HH:mm:ss').local().toDate();
                });
                deferred.resolve(response.data);
            }, function(data, status, headers, config) {
                deferred.reject(data, status);
            });
            return deferred.promise;
        },

        /**
         * Deletes a payment record by ID
         */
        deletePayment: function(paymentId) {
            var deferred = $q.defer();
            $http.delete('/api/v1/payment/' + paymentId).then(function() {
                deferred.resolve();
            }, function(data, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }
    };
});