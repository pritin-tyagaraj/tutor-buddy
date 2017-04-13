(function() {
    "use strict";

    var batchId;

    angular.module('dashboardApp').controller('StudentsController', function($scope, tbBatchService, $mdDialog) {
        // Setup scope for UI bindings
        $scope.loading = false;

        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === Tab.Students) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;

                // Load the list of students
                $scope.refreshStudentList($scope, tbBatchService, $scope.currentBatchId);
            }
        });

        // Handle addition of students
        $scope.addStudent = function(ev) {
            $mdDialog.show({
                    controller: ['$scope', function($dialogScope) {
                        $dialogScope.cancel = function() {
                            $mdDialog.cancel();
                        };
                        $dialogScope.done = function() {
                            $mdDialog.hide($dialogScope.student);
                        };
                    }],
                    templateUrl: 'dashboard/components/batch-details/students/newStudentDialog.template.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: false
                })
                .then(function(data) {
                    // Start the backend operation to add student to batch
                    $scope.loading = true;
                    tbBatchService.addStudent($scope.currentBatchId, data).then(function() {
                        $scope.refreshStudentList($scope, tbBatchService, $scope.currentBatchId);
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
                $scope.loading = true;
                tbBatchService.removeStudent($scope.currentBatchId, student.id).then(function() {
                    $scope.refreshStudentList($scope, tbBatchService, $scope.currentBatchId);
                });
            });
        };

        // Refresh the list of students
        $scope.refreshStudentList = function() {
            $scope.loading = true;
            tbBatchService.getStudentsForBatch(batchId).then(function(data) {
                $scope.students = data;
                $scope.loading = false;
            });
        };
    });
})();