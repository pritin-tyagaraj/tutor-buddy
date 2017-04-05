var welcomeApp = angular.module('dashboardApp', ['ngMaterial', 'md.data.table', 'ngMessages', 'ngRoute', 'overview', 'payments', 'batches', 'batchDetails', 'apiConnector']);
welcomeApp.controller('appController', function($scope, $timeout, $location, $log, $interval, $mdSidenav, $log, $rootScope, $route, $window, tbUserService) {
    var adsInitialized = false;

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

    // Init Google ads
    initAds();

    // ----- Private methods -----
    function initAds() {
        // We can init the ad only while the sidenav is open. So keep waiting for that to happen. Once we place the ad, we can forget about it.
        $mdSidenav('left', true).then(function(leftNav) {
            var interval = $interval(function() {
                if (leftNav.isOpen() || leftNav.isLockedOpen()) {
                    //Add the UI
                    var adContainer = angular.element(document.querySelector('#googleAdContainer'));
                    adContainer.append(
                        '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-8055457279999981" data-ad-slot="6056269208" data-ad-format="auto"></ins>'
                    );

                    //Invoke the script
                    try {
                        (adsbygoogle = window.adsbygoogle || []).push({});
                    } catch (err) {
                        return;
                    }

                    //Done!
                    $log.info('Ads loaded.');
                    adsInitialized = true;
                    $interval.cancel(interval);
                }
            }, 2000);
        });
    }
});

welcomeApp.controller('rightController', function($scope, $timeout, $mdSidenav, $log) {

});