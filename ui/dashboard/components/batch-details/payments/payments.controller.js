(function() {
    "use strict";

    var batchId;

    angular.module('dashboardApp').controller('PaymentsController', function($scope, $mdDialog, tbPaymentService, tbBatchService) {
        // Setup scope for UI bindings
        $scope.loading = false;
        $scope.table = {
            rowSelection: true,
            selectedRows: [],
            sortOrder: '-time',
            filter: {
                student: null
            }
        };

        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === Tab.Payments) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;

                // Refresh the payments list
                $scope.refreshPaymentsList();

                // Load students to be shown in the filter dropdown
                tbBatchService.getStudentsForBatch(batchId).then(function(students) {
                    $scope.paymentsStudents = students;
                });
            }
        });

        // Handle manual recording of payment
        $scope.recordPayment = function(ev) {
            //Load the list of students in this batch to show within the dialog
            $scope.loading = true;
            tbBatchService.getStudentsForBatch(batchId).then(function(students) {
                // Now show the record payment dialog
                $scope.loading = false;
                $mdDialog.show({
                        locals: {
                            students: students
                        },
                        controller: ['$scope', 'students', function($dialogScope, students) {
                            $dialogScope.batchStudents = students;
                            $dialogScope.cancel = function() {
                                $mdDialog.cancel();
                            };
                            $dialogScope.done = function() {
                                $mdDialog.hide($dialogScope);
                            };
                        }],
                        templateUrl: 'dashboard/components/batch-details/payments/recordPaymentDialog.template.html',
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        fullscreen: false
                    })
                    .then(function(data) {
                        // Start the backend operation to add student to batch
                        $scope.loading = true;
                        tbPaymentService.recordPayment(batchId, data.student, data.amount, data.time, data.tutorComment).then(function() {
                            //Refresh payment screen here
                            $scope.refreshPaymentsList();
                        });
                    }, function() {
                        //Cancel was pressed
                    });
            });
        };

        // Handle deletion of the selected payment row
        $scope.deletePayment = function(ev) {
            var confirmDialog = $mdDialog.confirm()
                .title('Delete payment record')
                .textContent('Are you sure you want to permanently delete the selected payment record?')
                .ariaLabel('Delete payment record')
                .targetEvent(ev)
                .ok('Yes, delete payment record')
                .cancel('Cancel');

            $mdDialog.show(confirmDialog).then(function() {
                // User confirmed deletion
                $scope.loading = true;
                tbPaymentService.deletePayment($scope.table.selectedRows[0].id).then(function() {
                    $scope.refreshPaymentsList();
                });
                $scope.table.selectedRows = [];
            });
        };

        // Fetch list of payments
        $scope.refreshPaymentsList = function() {
            // Get ready..
            var filterStudentId = ($scope.table.filter.student === "all") ? null : $scope.table.filter.student;

            // Fetch the data
            $scope.loading = true;
            tbPaymentService.getPaymentsForBatch(batchId, filterStudentId).then(function(data) {
                $scope.payments = data;
                $scope.loading = false;
            });
        };
    });
})();