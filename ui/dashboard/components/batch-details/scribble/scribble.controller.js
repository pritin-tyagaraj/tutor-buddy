(function() {
    "use strict";

    var batchId;
    var quill;
    var change;
    var Delta = Quill.import('delta');
    var autoRefreshPromise;

    angular.module('dashboardApp').controller('ScribbleController', function($scope, $timeout, $interval, tbScribbleService, BatchDetailsTab) {
        // Setup scope for UI bindings
        $scope.loading = false;
        $scope.lastSaved = "";

        // Initialize the editor
        $timeout(function() {
            quill = new Quill('#editor', {
                theme: 'snow'
            });

            // Listen for changes
            change = new Delta();
            quill.on('text-change', function(delta) {
                change = change.compose(delta);
            });
        }, 1000);


        // React if the user has just arrived to the Payments tab
        $scope.$watch('selectedTabIndex', function(currentTab, oldTab) {
            if (currentTab === BatchDetailsTab.Scribble) {
                // Which batch are we working with?
                batchId = $scope.$parent.currentBatchId;

                // Check if auto-save needs to be done
                autoRefreshPromise = $interval(function() {
                    if(change.length() > 0) {
                        tbScribbleService.saveScribble(batchId, quill.getContents()).then(function() {

                        });
                        change = new Delta();
                    }
                }, 2000);

                // Check and udpate the UI if a scribble already exists for this batch
                tbScribbleService.getScribble(batchId).then(function(savedContent) {
                    quill.setContents(savedContent);
                });
            } else {
                if(autoRefreshPromise) {
                    $interval.cancel(autoRefreshPromise);
                }
            }
        });
    });
})();