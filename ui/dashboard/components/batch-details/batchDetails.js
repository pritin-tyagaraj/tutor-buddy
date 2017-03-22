// Enum for each tab in the batch details screen
var Tab = {
    Students: 1
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

    .controller('batchDetailsController', function($scope, $location, tbBatchService, tbUserService, $mdDialog, $routeParams) {
        // Which batch are we showing details for?
        var batchId = $routeParams.batchId;

        // React when the user switches tabs
        $scope.selectedTabIndex = 0;
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === Tab.Students) {
                refreshStudentList($scope, tbBatchService, batchId);
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

// Controller for the 'Add student' dialog
function NewStudentDialogController($scope, $mdDialog) {
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.done = function() {
        $mdDialog.hide($scope.student);
    };
}