angular.module('payments', ['ngMaterial', 'ngRoute'])

    // Routes for this module
    .config(function($routeProvider) {
        $routeProvider.when('/payments', {
            templateUrl: 'dashboard/components/payments/paymentsView.html',
            controller: 'paymentsController',
            title: "Payments"
        });
    })

    // Controller
    .controller('paymentsController', function($scope) {
        $scope.message = "Payment info goes here";
    });