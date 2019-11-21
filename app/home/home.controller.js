(function () {

  'use strict';

  angular
    .module('app')
    .controller('HomeController', homeController);

  homeController.$inject = ['$scope','authService','$http'];

  function homeController($scope,authService,$http) {

    var vm = this;
    vm.auth = authService;
    vm.profile;
    vm.fullProfile;

    if (authService.getCachedProfile()) {
      vm.profile = authService.getCachedProfile();

    } else {
      authService.getProfile(function(err, profile) {
        vm.profile = profile;

        //$scope.$apply();
      });
    }


    vm.getPublicMessage = function() {
      $http.get("http://localhost:3001/api/public").then(function(response)
      {
        vm.message = response.data.message;
      });
    }

    vm.getPrivateMessage = function() {
      $http.get("http://localhost:3001/api/private", 
      {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('access_token')
        }
      }).then(function(response)
      {
        vm.message = response.data.message;
      }).catch(function(error)
      {
        vm.message = "You are very stupid man";
      });
    }

    vm.getGoogleProfile = function() {
      var foo = vm.profile;
      $http.get("http://localhost:3001/api/getuser",
      {
        headers: {
          UserId: foo.sub
        }
      }).then(function(response)
      {
        vm.message = response.data.message;
        vm.fullProfile = response.data.message;
      }).catch(function(error)
      {
        vm.message = "You are stupid";
      });
    }

    vm.getGoogleData = function(){
      var identity = parseProfile(JSON.parse(vm.fullProfile).identities,'google-oauth2');
      $http.get("http://localhost:3001/api/getpeopledata",
      {
        headers: {
          gAccess_token: identity[0].access_token
        }
      }).then(function(response)
      {
        vm.message = response.data.message
      }).catch(function(error)
      {

        vm.message=error;
      });
    }

  }

  function parseProfile(data, providerName)
  {
    let identity = data.filter(function(item)
    {
      return item.provider ===providerName;
    })
    return identity;
  }

})();