var welcomeApp = angular.module('dashboardApp', ['ngMaterial', 'ngMessages', 'ngRoute', 'overview', 'payments', 'batches', 'apiConnector']);
welcomeApp.controller('appController', function($scope, $timeout, $location, $mdSidenav, $log, $rootScope, $route, $window, tbUserService) {
    $scope.message = 'This message is in the scope!';
    $scope.appTitle = 'Tutor Buddy';
    $scope.viewTitle = '';
    $scope.userName = '...';
    $scope.navItems = [{
        primaryText: 'Overview',
        secondaryText: 'Upcoming classes, tasks and more',
        icon: 'dashboard',
        navTarget: '/overview'
    }, {
        primaryText: 'Batches',
        secondaryText: 'Create and edit your batches of students',
        icon: 'group',
        navTarget: '/batches'

    }, {
        primaryText: 'Payments',
        secondaryText: 'Manage your students\' fees',
        icon: 'attach_money',
        navTarget: '/payments'
    }];

    // Toggle left panel
    $scope.toggleLeft = function() {
        $mdSidenav('left').toggle();
    };

    // Logout
    $scope.logout = function() {
        $window.location.href = '/auth/facebook/logout';
    };

    // Navigation from the left menu
    $scope.navigate = function(navTarget) {
        $location.path(navTarget);
        $timeout(function() {
            $mdSidenav('left').toggle();
        }, 320);
    };

    $scope.toggleRight = function() {
        $mdSidenav('right').toggle();
    };

    // Update the title everytime the route changes
    $rootScope.$on("$routeChangeSuccess", function(currentRoute, previousRoute) {
        //Change page title, based on Route information
        $scope.viewTitle = $route.current.title;
        $scope.currentRoute = $route.current.originalPath;
    });

    // Get the user's name
    tbUserService.getUserProfile().then(function(data) {
        $scope.userName = data.first_name + ' ' + data.last_name;
    });
});

welcomeApp.controller('rightController', function($scope, $timeout, $mdSidenav, $log) {

});