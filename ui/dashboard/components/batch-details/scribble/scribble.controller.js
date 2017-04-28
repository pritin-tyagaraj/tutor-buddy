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
                modules: {
                    toolbar: [
                        [{ 'font': [] }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown

                        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
                        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
                        ['blockquote'],

                        [{ 'header': 1 }],               // custom button values
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent

                        [{ 'align': [] }],

                        ['clean']                                         // remove formatting button
                    ]
                },
                placeholder: 'You can scribble notes for this batch by typing here. Only you can see your scribbles.',
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