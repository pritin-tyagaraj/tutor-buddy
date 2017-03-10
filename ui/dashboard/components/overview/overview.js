angular.module('overview', ['ngMaterial', 'ngRoute', 'ngMdIcons'])

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
    .controller('overviewController', function($scope) {
        $scope.message = "A personalized overview (or maybe upcoming classes/calendar) goes here";
    });