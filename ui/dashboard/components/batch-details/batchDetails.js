// Enum for each tab in the batch details screen
var Tab = {
    Students: 1,
    Payments: 4
};

angular.module('batchDetails', ['ngMaterial', 'ngRoute', 'ngMdIcons', 'material.components.expansionPanels', 'apiConnector'])
    // Routes for this module
    .config(function($routeProvider) {
        $routeProvider.when('/batch/:batchId', {
            templateUrl: 'dashboard/components/batch-details/batchDetailsView.html',
            controller: 'batchDetailsController',
            title: "Batch Details"
        });
    })

    .controller('batchDetailsController', function($scope, $location, tbBatchService, tbUserService, tbPaymentService, $mdDialog, $routeParams) {
        // Which batch are we showing details for?
        var batchId = $routeParams.batchId;

        // React when the user switches tabs
        $scope.selectedTabIndex = 0;
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === Tab.Students) {
                refreshStudentList($scope, tbBatchService, batchId);
            } else if (currentTab === Tab.Payments) {
                refreshPaymentsList($scope, tbPaymentService, batchId);
            }
        });

        //Handle deletion of batches
        $scope.deleteBatch = function(ev) {
            var confirmDialog = $mdDialog.confirm()
                .title('Delete Batch')
                .textContent('Are you sure you want to delete this batch? There\'s no going back!')
                .ariaLabel('Delete Batch')
                .targetEvent(ev)
                .ok('Yes, delete this batch')
                .cancel('Cancel');

            $mdDialog.show(confirmDialog).then(function() {
                // User confirmed deletion
                tbBatchService.deleteBatch(batchId).then(function() {
                    $location.path('/batches');
                });
            });
        };

        // Handle addition of students
        $scope.addStudent = function(ev) {
            $mdDialog.show({
                    controller: NewStudentDialogController,
                    templateUrl: 'dashboard/components/batch-details/newStudentDialog.template.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: false
                })
                .then(function(data) {
                    // Start the backend operation to add student to batch
                    $scope.loadingStudents = true;
                    tbBatchService.addStudent(batchId, data).then(function() {
                        refreshStudentList($scope, tbBatchService, batchId);
                    });
                }, function() {
                    //Cancel was pressed
                });
        };

        //Handle removal of students
        $scope.removeStudent = function(ev, student) {
            var confirmDialog = $mdDialog.confirm()
                .title('Remove Student')
                .textContent('Are you sure you want to remove ' + student.first_name + ' ' + student.last_name + ' from this batch?')
                .ariaLabel('Remove Student ' + student.first_name + ' ' + student.last_name)
                .targetEvent(ev)
                .ok('Yes, remove this student')
                .cancel('Cancel');

            $mdDialog.show(confirmDialog).then(function() {
                // User confirmed deletion
                $scope.loadingStudents = true;
                tbBatchService.removeStudent(batchId, student.id).then(function() {
                    refreshStudentList($scope, tbBatchService, batchId);
                });
            });
        };

        // Handle manual recording of payment
        $scope.recordPayment = function(ev) {
            //Load the list of students in this batch to show within the dialog
            $scope.loadingPayments = true;
            tbBatchService.getStudentsForBatch(batchId).then(function(students) {
                // Now show the record payment dialog
                $scope.loadingPayments = false;
                $mdDialog.show({
                        locals: {
                            students: students
                        },
                        controller: ['$scope', 'students', function($scope, students) {
                            $scope.batchStudents = students;
                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };
                            $scope.done = function() {
                                $mdDialog.hide($scope);
                            };
                        }],
                        templateUrl: 'dashboard/components/batch-details/recordPaymentDialog.template.html',
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        fullscreen: false
                    })
                    .then(function(data) {
                        // Start the backend operation to add student to batch
                        $scope.loadingPayments = true;
                        tbPaymentService.recordPayment(batchId, data.student, data.amount, data.time, data.tutorComment).then(function() {
                            //Refresh payment screen here
                            refreshPaymentsList($scope, tbPaymentService, batchId);
                        });
                    }, function() {
                        //Cancel was pressed
                    });
            });
        };
    });

/**
 * Helper to fetch list of students
 */
function refreshStudentList($scope, tbBatchService, batchId) {
    $scope.loadingStudents = true;
    tbBatchService.getStudentsForBatch(batchId).then(function(data) {
        $scope.students = data;
        $scope.loadingStudents = false;
    });
}

/**
 * Helper to fetch list of payments
 */
function refreshPaymentsList($scope, tbPaymentService, batchId) {
    $scope.loadingPayments = true;
    tbPaymentService.getPaymentsForBatch(batchId).then(function(data) {
        $scope.payments = data;
        $scope.loadingPayments = false;
    });
}

// Controller for the 'Add student' dialog
function NewStudentDialogController($scope, $mdDialog) {
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.done = function() {
        $mdDialog.hide($scope.student);
    };
}