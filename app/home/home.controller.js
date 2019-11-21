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
    vm.email_verified = false;
    vm.order_click=false;
  

    if(vm.auth.isAuthenticated())
    {
      if (authService.getCachedProfile()) {
        vm.profile = authService.getCachedProfile();
      } else {
        authService.getProfile(function(err, profile) {
          vm.profile = profile;
          getFullUserProfile();
          
        });
      }
    }
    else{
      vm.message="please log in first";
    }    

    vm.orderPizza = function()
    {
      
      if(vm.auth.isAuthenticated())
      {
        if(vm.email_verified)
        {
          vm.message = 'email verified? ' + vm.email_verified;
          alert("let's order some pizza!");
        } 
        else{
          vm.order_click=true;
          vm.message = 'your email is not verified. Would you like to verify it now?'
        }
      }
      else
      {
        vm.auth.login();
      }

    }

    vm.verifyEmail = function() {
      $http.get(heroku +"api/verifyemail",
      {
        headers: {
          UserId: vm.profile.sub
        }
      }).then(function(response)
      {
        getFullUserProfile()

      });
    }

    vm.getPublicMessage = function() {
      $http.get(heroku +"api/public").then(function(response)
      {
        vm.message = response.data.message;
      });
    }

    vm.getPrivateMessage = function() {
      $http.get(heroku +"api/private", 
      {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('access_token')
        }
      }).then(function(response)
      {
        vm.message = response.data.message;
      }).catch(function(error)
      {
        vm.message = "Something very wrong has happened: " + error;
      });
    }

    function getFullUserProfile() {
      var foo = vm.profile;
      $http.get(heroku +"api/getuser",
      {
        headers: {
          UserId: foo.sub
        }
      }).then(function(response)
      {
        vm.message = response.data.message;
        vm.fullProfile = response.data.message;
        vm.email_verified = JSON.parse(vm.fullProfile).email_verified;
      }).catch(function(error)
      {
        vm.message = "You are stupid";
      });
    }

    // vm.getGoogleData = function(){
    //   var identity = parseProfile(JSON.parse(vm.fullProfile).identities,'google-oauth2');
    //   $http.get("http://localhost:3001/api/getpeopledata",
    //   {
    //     headers: {
    //       gAccess_token: identity[0].access_token,
    //       UserId: vm.profile.sub
    //     }
    //   }).then(function(response)
    //   {
    //     vm.message = response.data.message
    //   }).catch(function(error)
    //   {

    //     vm.message=error;
    //   });
    // }

  }

  // function parseProfile(data, providerName)
  // {
  //   let identity = data.filter(function(item)
  //   {
  //     return item.provider ===providerName;
  //   })
  //   return identity;
  // }

})();