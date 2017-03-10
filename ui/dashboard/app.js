var welcomeApp = angular.module('dashboardApp', ['ngMaterial', 'ngRoute', 'overview', 'payments', 'apiConnector']);
welcomeApp.controller('appController', function($scope, $timeout, $mdSidenav, $log, $rootScope, $route, $window, tbUserService) {
    $scope.message = 'This message is in the scope!';
    $scope.appTitle = 'Tutor Buddy';
    $scope.viewTitle = '';
    $scope.userName = '...';

    // Toggle left panel
    $scope.toggleLeft = function() {
        $mdSidenav('left').toggle();
    };

    // Logout
    $scope.logout = function() {
        $window.location.href = '/auth/facebook/logout';
    };

    $scope.toggleRight = function() {
        $mdSidenav('right').toggle();
    };

    // Update the title everytime the route changes
    $rootScope.$on("$routeChangeSuccess", function(currentRoute, previousRoute) {
        //Change page title, based on Route information
        $scope.viewTitle = $route.current.title;
    });

    // Get the user's name
    tbUserService.getUserProfile().then(function(response) {
        $scope.userName = response.data.first_name + ' ' + response.data.last_name;
    });
});

welcomeApp.controller('rightController', function($scope, $timeout, $mdSidenav, $log) {

});