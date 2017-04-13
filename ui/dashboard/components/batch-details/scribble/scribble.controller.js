(function() {
    "use strict";

    var batchId;

    angular.module('dashboardApp').controller('ScribbleController', function($scope, BatchDetailsTab) {
        // Setup scope for UI bindings
        $scope.loading = false;

        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === BatchDetailsTab.Scribble) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;
            }
        });
    });
})();