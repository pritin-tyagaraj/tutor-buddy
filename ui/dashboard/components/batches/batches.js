angular.module('batches', ['ngMaterial', 'ngRoute', 'ngMdIcons', 'material.components.expansionPanels', 'apiConnector'])

    // Routes for this module
    .config(function($routeProvider) {
        $routeProvider.when('/batches', {
            templateUrl: 'dashboard/components/batches/batchesView.html',
            controller: 'batchesController',
            title: "Batches"
        });
    })

    // Controllers
    .controller('batchesController', function($scope, tbBatchService) {
        // Load the list of batches
        $scope.isLoading = true;
        $scope.batches = [];
        tbBatchService.getBatchesForUser().then(function(response) {
            $scope.batches = response.data;
            $scope.isLoading = false;
        });
    });