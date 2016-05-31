Fruits = new Mongo.Collection('fruits');

if (Meteor.isClient) {

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  angular.module('powerci', ['angular-meteor', 'ui.router', 'ngAnimate', 'accounts.ui']);
 
  angular.module('powerci').config(function($stateProvider, $urlRouterProvider) {



    $urlRouterProvider.when('/dashboard', '/dashboard/overview');
    $urlRouterProvider.otherwise('/login');

    $stateProvider
    	.state('base', {
        abstract: true,
        url: '',
        templateUrl: 'views/base.html'
      })
        .state('login', {
          url: '/login',
          templateUrl: 'client/views/login.ng.html',
          controller: 'LoginCtrl'
        })
        .state('signup', {
          url: '/signup',
          templateUrl: 'client/views/signup.ng.html',
          controller: 'LoginCtrl'
        })
        .state('dashboard', {
          url: '/dashboard',
          templateUrl: 'client/views/dashboard.ng.html',
          controller: 'DashboardCtrl',
          resolve: {
            "currentUser": ["$meteor", function($meteor){
              return $meteor.requireUser();
            }]
          }
        })
          .state('overview', {
            url: '/overview',
            parent: 'dashboard',
            templateUrl: 'client/views/dashboard/overview.ng.html',
            controller: 'OverviewController'
          })
          .state('search', {
            url: '/search',
            parent: 'dashboard',
            templateUrl: 'client/views/dashboard/search.ng.html'
          })
          .state('favorites', {
            url: '/favorites',
            parent: 'dashboard',
            templateUrl: 'client/views/dashboard/favorites.ng.html'
          })
          .state('settings', {
            url: '/settings',
            parent: 'dashboard',
            templateUrl: 'client/views/dashboard/settings.ng.html'
            //controller: 'DatapageCtrl'
          })
          .state('profile', {
            url: '/profile',
            parent: 'dashboard',
            templateUrl: 'client/views/dashboard/profile.ng.html'
            //controller: 'DatapageCtrl'
          })
          .state('datapage', {
            url: '/datapage',
            parent: 'dashboard',
            templateUrl: 'client/views/dashboard/datapage.ng.html',
            controller: 'DatapageCtrl'
          });
    
  });

  angular.module('powerci').run(["$rootScope", "$state", function($rootScope, $state) {
    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      if (error === "AUTH_REQUIRED") {
        $state.go('login');
      }
    });
  }]);

  angular.module('powerci').controller('BaseCtrl', ['$scope', '$meteor', '$location',
    function ($scope, $meteor) {
    }
  ]);

  angular.module('powerci').controller('DashboardCtrl', function($scope, $state, $location) {
    $scope.$state = $state;
    
    $scope.user = Meteor.user().username;

    $scope.logout = function(){
      Meteor.logout();
    }
  });

  angular.module('powerci').controller('LoginCtrl', function($scope, $location) {
      $scope.loginFailed = false;

      $scope.submit = function(email, passwd) {
        if(email==null || typeof(email)=='undefined' || email=='')
          alert('Please enter email');
        else if(passwd==null || typeof(passwd)=='undefined' || passwd=='')
          alert('Please enter password');
        else{
          Meteor.loginWithPassword(email, passwd);

          Accounts.onLoginFailure(function(){
            $scope.loginFailed = true;
          });

          Accounts.onLogin(function(){
            $scope.loginFailed = false;
            $location.path('/dashboard');
            console.log('lopgin oook');
          });

        }
        return false;
      }

      $scope.createuser = function(username, email, passwd, passwd1){
        if(passwd == passwd1){
          Accounts.createUser({
              username: username,
              email: email,
              password: passwd
          });

          Meteor.loginWithPassword(email, passwd);

          Accounts.onLoginFailure(function(){
            $location.path('/login');
          });

          Accounts.onLogin(function(){
            $location.path('/dashboard');
          });

        }
        else
          alert("passwords donot match");
      }

  });

  angular.module('powerci').controller('DatapageCtrl', ['$scope', '$meteor',
    function ($scope, $meteor) {
 
      $scope.fruits = $meteor.collection(function(){
        return Fruits.find($scope.getReactively('query'))
      });

      $scope.$watch('citrus', function() {
        if ($scope.citrus)
          $scope.query = {citrus: {$ne: false}};
        else
          $scope.query = {};
      });
      
      $scope.addFruit = function (newFruit) {
        Fruits.insert({
          text: newFruit,
          citrus: false,
          username: Meteor.user().username
        });
    
      }
      
    }]);

  angular.module('powerci').controller("TestController", ['$scope', '$meteor', '$http',
    function ($scope, $meteor, $http) {

      $scope.parseTest = function(o) {
        var ret = Array();
        var obj = {};

        $.each(o, function(i, elem) {
          obj.name = elem.test_suite_name;
          if (elem.name == "vbus_max")
            obj.vbus_max = elem.measurements[0].measure + '' + elem.units;
          else if (elem.name == "energy")
            obj.energy = elem.measurements[0].measure + '' + elem.units;
          else if (elem.name == "power_min")
            obj.power_min = elem.measurements[0].measure + '' + elem.units;
          else if (elem.name == "power_max")
            obj.power_max = elem.measurements[0].measure + '' + elem.units;
          else if (elem.name == "power_avg")
            obj.power_avg = elem.measurements[0].measure + '' + elem.units;
          else if (elem.name == "current_min")
            obj.current_min = elem.measurements[0].measure + '' + elem.units;
          else if (elem.name == "current_max")
            obj.current_max = elem.measurements[0].measure + '' + elem.units;
        });
        ret.push(obj);
        return ret;
      }

      $http({
        method: 'GET', 
        url: 'http://powerci.org:8888/test/case/?test_suite_id=' + $scope.$parent.test._id.$oid,
        headers: {
          'Authorization': '3caf9787-2521-4276-ad2e-af2c64d19707'
        }
      }).then(function successCallback(response) {
        $scope.objs = $scope.parseTest(response.data.result);
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      }); 
  }]);

  angular.module('powerci').controller('OverviewController', ['$scope', '$meteor', '$http',
    function ($scope, $meteor, $http) {
      $scope.loaded = false;
      jQuery.support.cors = true;
 
      $scope.collapseBtn = function($event) {
        if ($($event.target).attr('class') == "fa fa-plus clickable") {
          $($event.target).attr('class', 'fa fa-minus clickable');
        } else {
          $($event.target).attr('class', 'fa fa-plus clickable');
        }
      }

      $scope.favorite = function($event, o) {
        console.log('Want to favorite obj ID ' + o._id.$id);
        if ($($event.target).attr('class') == "fa fa-star") {
          $($event.target).attr('class', 'fa fa-star-o');
        } else {
          $($event.target).attr('class', 'fa fa-star');
        }
      };

      $http({
        method: 'GET', 
        url: 'http://powerci.org:8888/test/suite',
        headers: {
          'Authorization': '3caf9787-2521-4276-ad2e-af2c64d19707'
        }
      }).then(function successCallback(response) {
        $scope.loaded = true;
        $scope.tests = response.data.result;
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });      
    }]);
}