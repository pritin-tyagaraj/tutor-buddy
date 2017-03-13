angular.module('overview', ['ngMaterial', 'ngRoute', 'ngMdIcons', 'apiConnector'])

    // Routes for this module
    .config(function($routeProvider) {
        $routeProvider.when('/', {
            redirectTo: '/overview'
        });

        $routeProvider.when('/overview', {
            templateUrl: 'dashboard/components/overview/overviewView.html',
            controller: 'overviewController',
            title: "Overview"
        });
    })

    // Controller
    .controller('overviewController', function($scope, tbUserService) {
        $scope.createTutorProfile = function() {
            tbUserService.createTutorProfile().then(function() {
                alert('Tutor Profile Created');
            }, function(data, status) {
                alert('Server says... \n' + data.statusText + ': ' + data.data.error);
            });
        };
    });