(function() {
    "use strict";

    var batchId;

    angular.module('dashboardApp').controller('AttendanceController', function($scope, $mdDialog, tbBatchService, BatchDetailsTab) {
        // Setup scope for UI bindings
        $scope.loading = false;

        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === BatchDetailsTab.Attendance) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;
            }
        });
    });
})();