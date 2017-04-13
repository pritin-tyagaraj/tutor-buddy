(function() {
    "use strict";

    var batchId;

    angular.module('dashboardApp').controller('ScribbleController', function($scope) {
        // Setup scope for UI bindings
        $scope.loading = false;

        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === Tab.Scribble) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;
            }
        });
    });
})();