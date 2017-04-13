(function() {
    "use strict";

    var batchId;

    angular.module('dashboardApp').controller('AttendanceController', function($scope, $mdDialog, tbBatchService) {
        // Setup scope for UI bindings
        $scope.loading = false;

        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === Tab.Attendance) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;
            }
        });
    });
})();